/**
 * Wire-level test for the MCP stdio transport (SDKS-5511 task 9, audit item 1).
 *
 * Effect's Console writes to process.stdout — the same fd the MCP JSON-RPC
 * transport uses. Any Console.log reached from an MCP handler would inject
 * plain text into the protocol stream and break the client. This test spawns
 * the compiled binary as the real server runs (`ping-lf mcp`), performs the
 * JSON-RPC handshake, calls generate_callback against a temp project, and
 * asserts every stdout line is parseable JSON-RPC.
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
  readonly id: number;
  readonly result?: { isError?: boolean; content?: ReadonlyArray<{ text?: string }> };
  readonly error?: { message?: string };
}

const collectResponses = (
  projectDir: string,
): { readonly responses: ReadonlyArray<JsonRpcResponse>; readonly stdout: string } => {
  const input = [
    jsonRpcLine(1, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'vitest-stdio-test', version: '0.0.0' },
    }),
    jsonRpcLine(2, 'notifications/initialized'),
    jsonRpcLine(3, 'tools/list'),
    jsonRpcLine(4, 'tools/call', {
      name: 'generate_callback',
      arguments: { name: 'MyCallback', directory: projectDir },
    }),
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('node', [MAIN_JS, 'mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    const stdoutLines: string[] = [];
    const responses: JsonRpcResponse[] = [];
    let buffer = '';

    const finish = (error?: Error): void => {
      child.removeAllListeners();
      child.stdout?.removeAllListeners();
      child.stderr?.removeAllListeners();
      child.kill('SIGTERM');
      if (error) {
        reject(error);
        return;
      }
      resolve({ responses, stdout: stdoutLines.join('\n') });
    };

    const hardTimeout = setTimeout(() => {
      finish(
        new Error(
          `MCP server did not answer tools/call within 20s. stdout so far: ${stdoutLines
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
          if (typeof message.id === 'number') {
            responses.push(message);
            if (message.id === 4) {
              clearTimeout(hardTimeout);
              // Give the process a beat to flush, then end the harness.
              setTimeout(() => finish(), 200);
            }
          }
        } catch {
          // A non-JSON stdout line is itself a failure of the assertion below;
          // keep collecting so the test can report it.
          stdoutLines.push(line);
        }
      }
    });

    child.stderr?.on('data', () => {
      /* diagnostics only; stderr is allowed to carry anything */
    });

    for (const line of input) {
      child.stdin?.write(line + '\n');
    }
    child.stdin?.end();
  });
};

describe('MCP stdio transport', () => {
  it('keeps stdout to pure JSON-RPC while generate_callback runs', async () => {
    if (!existsSync(MAIN_JS)) {
      throw new Error(
        `Compiled CLI missing at ${MAIN_JS}. Run: pnpm --filter @forgerock/login-framework-cli build`,
      );
    }

    // Seed an initialized project so generate_callback succeeds.
    const projectDir = mkdtempSync(join(tmpdir(), 'ping-lf-mcp-stdio-'));
    writeFileSync(
      join(projectDir, '.generator-version'),
      JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
      'utf8',
    );
    mkdirSync(join(projectDir, 'custom', 'components', 'callbacks'), { recursive: true });
    mkdirSync(join(projectDir, 'custom', 'components', 'stages'), { recursive: true });

    try {
      const { responses, stdout } = await collectResponses(projectDir);

      expect(responses.length).toBeGreaterThanOrEqual(2);
      for (const line of stdout.split('\n')) {
        if (line.trim().length === 0) {
          continue;
        }
        expect(() => JSON.parse(line)).not.toThrow();
      }

      const callResult = responses.find((response) => response.id === 4);
      expect(callResult).toBeDefined();
      expect(callResult!.result?.isError).toBe(false);

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
});
