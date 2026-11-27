/**
 * Wire-level test for the MCP stdio transport (SDKS-5511 task 9, audit item 1).
 *
 * Effect's Console writes to process.stdout, the same fd the MCP JSON-RPC
 * transport uses. Any Console.log reached from an MCP handler would inject
 * plain text into the protocol stream and break the client. This test spawns
 * the compiled binary as the real server runs (`ping-lf mcp`), performs the
 * JSON-RPC handshake, and asserts every stdout line is parseable JSON-RPC.
 *
 * Scenarios (F78):
 * - generate_callback against a temp project (the original audit scenario),
 * - a malformed stdin line followed by tools/list: the server must keep
 *   answering, keep stdout pure JSON-RPC, and stay alive,
 * - a request frame split across two stdin writes: the buffered tail must be
 *   decoded once its newline arrives (the stock parser buffers partial
 *   frames; a line-splitting wrapper would silently drop it),
 * - a tools/call naming an unknown tool: a JSON-RPC error response must
 *   arrive on stdout,
 * - a tools/call with invalid params: an isError tool result must arrive,
 * - a valid JSON-RPC request whose string id cannot convert to the internal
 *   id format (stock @effect/rpc converts ids with BigInt, so "abc" dies
 *   server-side): the request is dropped without stdout corruption and the
 *   next well-formed request must still be answered.
 *
 * The server does not exit when stdin closes, so the harness collects
 * responses by id and kills the process once the last expected response
 * arrives (or after a hard timeout). Runs against dist/src/main.js, so it
 * also catches src-vs-dist drift (a stale build serving old paths or
 * scaffolding into experimental/). Throws with a loud message when dist has
 * not been built.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MAIN_JS = join(__dirname, '..', 'dist', 'src', 'main.js');

const jsonRpcLine = (id: number, method: string, params?: unknown): string =>
  JSON.stringify({ jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) });

interface JsonRpcResponse {
  readonly id: number | string;
  readonly result?: { isError?: boolean; content?: ReadonlyArray<{ text?: string }> };
  readonly error?: { message?: string };
}

interface SessionResult {
  readonly responses: ReadonlyArray<JsonRpcResponse>;
  readonly stdout: string;
  readonly stderr: string;
  /** Whether the process was still running when the harness ended it. */
  readonly alive: boolean;
}

interface SessionOptions {
  /** Raw stdin lines written after the handshake lines. */
  readonly extraLines?: ReadonlyArray<string>;
  /** JSON-RPC request lines written after the handshake lines. */
  readonly extraRequests?: ReadonlyArray<string>;
  /**
   * Raw stdin writes with an inter-write delay, used to simulate a frame
   * fragmented across read chunks (each write is flushed separately; only
   * the last carries the terminating newline). Written after extraLines.
   */
  readonly fragmentedWrites?: ReadonlyArray<{ readonly text: string; readonly afterMs: number }>;
  /** Response id the harness waits for before ending (default: the last request id). */
  readonly waitForId?: number;
}

// The handshake every scenario starts with: initialize, initialized
// notification, tools/list.
const handshakeLines = (firstRequestId: number): ReadonlyArray<string> => [
  jsonRpcLine(firstRequestId, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'vitest-stdio-test', version: '0.0.0' },
  }),
  jsonRpcLine(0, 'notifications/initialized'),
];

const runSession = (options: SessionOptions): Promise<SessionResult> => {
  const waitForId = options.waitForId ?? 5;

  return new Promise((resolve, reject) => {
    const child = spawn('node', [MAIN_JS, 'mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    const stdoutLines: string[] = [];
    const stderrChunks: string[] = [];
    const responses: JsonRpcResponse[] = [];
    let buffer = '';
    let stillAlive = true;

    const finish = (error?: Error): void => {
      if (!stillAlive) {
        return;
      }
      stillAlive = false;
      child.removeAllListeners();
      child.stdout?.removeAllListeners();
      child.stderr?.removeAllListeners();
      child.kill('SIGTERM');
      if (error) {
        reject(error);
        return;
      }
      resolve({
        responses,
        stdout: stdoutLines.join('\n'),
        stderr: stderrChunks.join(''),
        alive: child.exitCode === null && child.signalCode === null,
      });
    };

    const hardTimeout = setTimeout(() => {
      finish(
        new Error(
          `MCP server did not answer request ${waitForId} within 20s. stdout so far: ${stdoutLines
            .join('\n')
            .slice(0, 2000)}`,
        ),
      );
    }, 20_000);

    child.on('error', (error) => {
      clearTimeout(hardTimeout);
      finish(error);
    });

    child.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim().length === 0) {
          continue;
        }
        stdoutLines.push(line);
        try {
          const message = JSON.parse(line) as JsonRpcResponse;
          if (typeof message.id === 'number' && message.id !== 0) {
            responses.push(message);
            if (message.id === waitForId) {
              clearTimeout(hardTimeout);
              // Give the process a beat to flush, then end the harness.
              setTimeout(() => finish(), 200);
            }
          }
        } catch {
          // A non-JSON stdout line is itself a failure of the assertion below;
          // keep collecting so the test can report it.
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk.toString('utf8'));
    });

    child.on('exit', () => {
      clearTimeout(hardTimeout);
      finish(new Error('MCP server exited before answering every request.'));
    });

    const lines: ReadonlyArray<string> = [
      ...handshakeLines(1),
      ...(options.extraRequests ?? []),
      ...(options.extraLines ?? []),
    ];
    for (const line of lines) {
      child.stdin?.write(line + '\n');
    }
    let fragmentationDelay = 0;
    for (const { text, afterMs } of options.fragmentedWrites ?? []) {
      fragmentationDelay += afterMs;
      setTimeout(() => child.stdin?.write(text), fragmentationDelay);
    }
    // Without fragmented writes the harness can end stdin immediately; with
    // them, keep stdin open until the last write has been flushed.
    if (fragmentationDelay === 0) {
      child.stdin?.end();
    } else {
      setTimeout(() => child.stdin?.end(), fragmentationDelay + 50);
    }
  });
};

const expectEveryLineIsJsonRpc = (stdout: string): void => {
  for (const line of stdout.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    expect(() => JSON.parse(line)).not.toThrow();
  }
};

const seedProject = (): string => {
  // Seed an initialized project so generate_callback succeeds.
  const projectDir = mkdtempSync(join(tmpdir(), 'ping-lf-mcp-stdio-'));
  writeFileSync(
    join(projectDir, '.generator-version'),
    JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
    'utf8',
  );
  mkdirSync(join(projectDir, 'custom', 'components', 'callbacks'), { recursive: true });
  mkdirSync(join(projectDir, 'custom', 'components', 'stages'), { recursive: true });
  return projectDir;
};

describe('MCP stdio transport', () => {
  it('keeps stdout to pure JSON-RPC while generate_callback runs', async () => {
    if (!existsSync(MAIN_JS)) {
      throw new Error(
        `Compiled CLI missing at ${MAIN_JS}. Run: pnpm --filter @forgerock/login-framework-cli build`,
      );
    }

    const projectDir = seedProject();

    try {
      const { responses, stdout } = await runSession({
        extraRequests: [
          jsonRpcLine(4, 'tools/call', {
            name: 'generate_callback',
            arguments: { name: 'MyCallback', directory: projectDir },
          }),
        ],
        waitForId: 4,
      });

      expect(responses.length).toBeGreaterThanOrEqual(2);
      expectEveryLineIsJsonRpc(stdout);

      const callResult = responses.find((response) => response.id === 4);
      expect(callResult).toBeDefined();
      expect(callResult?.result?.isError).toBe(false);

      const scaffolded = join(
        projectDir,
        'custom',
        'components',
        'callbacks',
        'my-callback',
        'my-callback.svelte',
      );
      expect(existsSync(scaffolded)).toBe(true);
      expect(readFileSync(scaffolded, 'utf8')).toContain('MyCallback');
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });

  // F78: one malformed stdin line must not wedge the server. The server has
  // to keep answering later requests, keep stdout to pure JSON-RPC, and stay
  // alive. A malformed line carries no extractable id, so the correct
  // behavior is a stderr warning and no stdout emission for that line.
  it('answers tools/list after a malformed stdin line (F78)', async () => {
    if (!existsSync(MAIN_JS)) {
      throw new Error(
        `Compiled CLI missing at ${MAIN_JS}. Run: pnpm --filter @forgerock/login-framework-cli build`,
      );
    }

    const { responses, stdout, stderr, alive } = await runSession({
      extraLines: ['this is not json'],
      extraRequests: [jsonRpcLine(2, 'tools/list')],
      waitForId: 2,
    });

    // (a) tools/list still got a response after the malformed line.
    const listResponse = responses.find((response) => response.id === 2);
    expect(listResponse).toBeDefined();
    expect(listResponse?.result).toBeDefined();

    // (b) every stdout line still parses as JSON-RPC.
    expectEveryLineIsJsonRpc(stdout);

    // (c) the process was still alive and answering when the harness ended it.
    expect(alive).toBe(true);

    // No id could be extracted from the malformed line, so nothing was written
    // for it on stdout; the warning went to stderr instead.
    expect(stderr).toContain('json');
  });

  // F78 blocker follow-up: a request frame split across two stdin writes
  // (the 64KB pipe boundary splits large frames the same way) must be
  // buffered until its newline arrives and then answered, not discarded as
  // two malformed lines. The stock parser buffers partial frames; the
  // resilient wrapper must preserve that.
  it('answers a request frame fragmented across two stdin writes (F78)', async () => {
    if (!existsSync(MAIN_JS)) {
      throw new Error(
        `Compiled CLI missing at ${MAIN_JS}. Run: pnpm --filter @forgerock/login-framework-cli build`,
      );
    }

    const { responses, stdout, alive } = await runSession({
      fragmentedWrites: [
        { text: '{"jsonrpc":"2.0","id":2,', afterMs: 100 },
        { text: '"method":"tools/list"}\n', afterMs: 400 },
      ],
      waitForId: 2,
    });

    expectEveryLineIsJsonRpc(stdout);

    const listResponse = responses.find((response) => response.id === 2);
    expect(listResponse).toBeDefined();
    expect(listResponse?.result).toBeDefined();
    expect(alive).toBe(true);
  });

  // Stock @effect/rpc converts request ids through BigInt, so a valid
  // JSON-RPC 2.0 string id like "abc" dies server-side with a defect and no
  // response (pre-existing stock behavior, out of the serialization layer's
  // reach). What the resilient wiring must guarantee: the defect renders
  // nowhere on stdout (the pretty-logger removals keep stdout pure JSON-RPC),
  // and the next well-formed request is still answered.
  it('keeps stdout pure and serves later requests after a non-numeric string id (F78)', async () => {
    if (!existsSync(MAIN_JS)) {
      throw new Error(
        `Compiled CLI missing at ${MAIN_JS}. Run: pnpm --filter @forgerock/login-framework-cli build`,
      );
    }

    const { responses, stdout, alive } = await runSession({
      extraRequests: [jsonRpcLine(2, 'tools/list')],
      extraLines: ['{"jsonrpc":"2.0","id":"abc","method":"tools/list"}'],
      waitForId: 2,
    });

    expectEveryLineIsJsonRpc(stdout);

    // The string-id request produced no stdout emission at all.
    expect(stdout).not.toContain('"abc"');
    expect(stdout).not.toContain('timestamp=');

    // The later well-formed request was still answered.
    const listResponse = responses.find((response) => response.id === 2);
    expect(listResponse).toBeDefined();
    expect(listResponse?.result).toBeDefined();
    expect(alive).toBe(true);
  });

  // F78: a tools/call naming an unknown tool must produce a JSON-RPC error
  // response on stdout (not silence, not a process crash).
  it('answers a tools/call for an unknown tool with a JSON-RPC error (F78)', async () => {
    if (!existsSync(MAIN_JS)) {
      throw new Error(
        `Compiled CLI missing at ${MAIN_JS}. Run: pnpm --filter @forgerock/login-framework-cli build`,
      );
    }

    const { responses, stdout, alive } = await runSession({
      extraRequests: [
        jsonRpcLine(2, 'tools/call', { name: 'definitely_not_a_tool', arguments: {} }),
      ],
      waitForId: 2,
    });

    expectEveryLineIsJsonRpc(stdout);

    const errorResponse = responses.find((response) => response.id === 2);
    expect(errorResponse).toBeDefined();
    expect(errorResponse?.error).toBeDefined();
    expect(typeof errorResponse?.error?.message).toBe('string');
    expect(errorResponse?.error?.message.length).toBeGreaterThan(0);
    expect(alive).toBe(true);
  });

  // F78: a request whose params violate the tool schema (name is a number
  // where a string is required) must still get a response on stdout. The
  // toolkit surfaces schema decode failures as a tool result with
  // isError: true (the JSON-RPC error channel is reserved for transport-level
  // failures), and the server must stay alive afterwards.
  it('answers a tools/call with invalid params with an isError result (F78)', async () => {
    if (!existsSync(MAIN_JS)) {
      throw new Error(
        `Compiled CLI missing at ${MAIN_JS}. Run: pnpm --filter @forgerock/login-framework-cli build`,
      );
    }

    const projectDir = seedProject();

    try {
      const { responses, stdout, alive } = await runSession({
        extraRequests: [
          jsonRpcLine(2, 'tools/call', {
            name: 'generate_callback',
            arguments: { name: 12345, directory: projectDir },
          }),
        ],
        waitForId: 2,
      });

      expectEveryLineIsJsonRpc(stdout);

      const callResponse = responses.find((response) => response.id === 2);
      expect(callResponse).toBeDefined();
      expect(callResponse?.result?.isError).toBe(true);
      const text = callResponse?.result?.content?.[0]?.text ?? '';
      expect(text).toContain('Failed to decode tool call parameters');
      expect(alive).toBe(true);
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
