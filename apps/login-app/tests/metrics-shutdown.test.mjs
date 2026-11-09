/**
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { request } from 'node:http';
import net from 'node:net';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Run after the existing adapter-node build, as CI does. No AM/IDM service is needed.
const appDirectory = fileURLToPath(new URL('../', import.meta.url));

function within(promise, milliseconds, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), milliseconds);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function unusedPort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

function appRequest(socketPath) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        socketPath,
        path: '/__metrics_shutdown_probe__',
        headers: { accept: 'application/json', connection: 'close' },
      },
      (response) => {
        response.resume();
        response.once('end', () => resolve(response.statusCode));
        response.once('error', reject);
      },
    );
    req.setTimeout(1000, () => req.destroy(new Error('App probe timed out')));
    req.once('error', reject);
    req.end();
  });
}

function requestCount(body) {
  return body
    .split('\n')
    .filter((line) => line.startsWith('login_app_requests_total{'))
    .reduce((sum, line) => sum + Number(line.slice(line.lastIndexOf(' ') + 1)), 0);
}

for (const unfinishedScrape of [false, true]) {
  test(
    `metrics-enabled SIGTERM exits with ${unfinishedScrape ? 'an unfinished' : 'an idle'} scrape`,
    {
      timeout: 20000,
    },
    async (t) => {
      const directory = await mkdtemp('/tmp/login2-metrics-');
      t.after(() => rm(directory, { recursive: true, force: true }));
      const socketPath = join(directory, 'app.sock');
      const port = await unusedPort();
      const child = spawn(process.execPath, ['build/index.js'], {
        cwd: appDirectory,
        env: {
          NODE_ENV: 'production',
          SOCKET_PATH: socketPath,
          METRICS_PORT: String(port),
          SHUTDOWN_TIMEOUT: '1',
          FR_AM_URL: 'http://127.0.0.1:1/am',
          FR_AM_COOKIE_NAME: 'test',
          FR_REALM_PATH: '/alpha',
          FR_AM_WELLKNOWN_URL: 'http://127.0.0.1:1/am/.well-known/openid-configuration',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const exited = once(child, 'exit').then(([code, signal]) => ({ code, signal }));
      let scrape;
      t.after(async () => {
        scrape?.destroy();
        if (child.pid && child.exitCode === null && child.signalCode === null) {
          child.kill('SIGKILL'); // Cleanup only this test's child after a regression/timeout.
          await exited;
        }
      });

      let output = '';
      const ready = new Promise((resolve) => {
        const read = (chunk) => {
          output = (output + chunk).slice(-8192);
          if (
            output.includes(`Listening on ${socketPath}`) &&
            output.includes('Login app metrics server listening on port')
          )
            resolve();
        };
        child.stdout.on('data', read);
        child.stderr.on('data', read);
      });
      await within(
        Promise.race([
          ready,
          exited.then((result) => {
            throw new Error(`App exited during startup: ${JSON.stringify(result)} ${output}`);
          }),
        ]),
        10000,
        'Metrics-enabled app did not start',
      );

      const metrics = async () => {
        const response = await fetch(`http://127.0.0.1:${port}/metrics`, {
          signal: AbortSignal.timeout(1000),
        });
        assert.equal(response.status, 200);
        return response.text();
      };
      const before = await metrics();
      assert.match(before, /^login_app_up 1$/m);
      assert.equal(await appRequest(socketPath), 404);
      const after = await metrics();
      assert.ok(
        requestCount(after) > requestCount(before),
        'App request must increment the served registry',
      );

      let scrapeClosed;
      if (unfinishedScrape) {
        scrape = net.connect(port, '127.0.0.1');
        await once(scrape, 'connect');
        scrapeClosed = new Promise((resolve) => scrape.once('close', resolve));
        scrape.on('error', () => {}); // Forced closure may reset this deliberately unfinished request.
        scrape.write('GET /metrics HTTP/1.1\r\nHost: localhost\r\n');
      }

      assert.equal(child.kill('SIGTERM'), true);
      assert.deepEqual(await within(exited, 3000, 'Metrics listener prevented graceful exit'), {
        code: 0,
        signal: null,
      });
      if (scrapeClosed) await within(scrapeClosed, 1000, 'Unfinished scrape remained open');
    },
  );
}
