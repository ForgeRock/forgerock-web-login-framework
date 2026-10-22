import { createRequire } from 'node:module';
import path from 'node:path';

import type { Plugin } from 'vite';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// IAM-12011 T5 proof support: compiles a component with the WIDGET's Svelte
// compiler (resolved from packages/login-widget, currently 5.53.7) instead of
// the editor's. The browser cannot load that compiler directly (CommonJS
// dependencies are not pre-bundled), so the proof page asks this dev-server
// endpoint. Read-only: it returns compiled text and touches no files.
export function widgetCompilePlugin(repositoryRoot: string): Plugin {
  const widgetRequire = createRequire(
    path.join(repositoryRoot, 'packages/login-widget/package.json'),
  );

  return {
    name: 'proof-compile-with-widget-svelte',
    configureServer(server) {
      server.middlewares.use('/api/compile-with-widget-svelte', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end('Method Not Allowed');
          return;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of request) {
          chunks.push(Buffer.from(chunk));
        }
        try {
          const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
          const source =
            typeof body === 'object' && body !== null && 'source' in body ? body.source : undefined;
          if (typeof source !== 'string') {
            response.statusCode = 400;
            response.end('Missing source');
            return;
          }
          const compilerModule: unknown = widgetRequire('svelte/compiler');
          const compile = isRecord(compilerModule) ? compilerModule.compile : undefined;
          const version = isRecord(compilerModule) ? compilerModule.VERSION : undefined;
          if (typeof compile !== 'function' || typeof version !== 'string') {
            throw new Error('Unexpected svelte/compiler module shape');
          }
          const result: unknown = Reflect.apply(compile, undefined, [
            source,
            {
              generate: 'client',
              css: 'injected',
              compatibility: { componentApi: 4 },
              filename: 'Component.svelte',
            },
          ]);
          const code = isRecord(result) && isRecord(result.js) ? result.js.code : undefined;
          if (typeof code !== 'string') {
            throw new Error('Compiler returned no js.code');
          }
          response.setHeader('content-type', 'application/json');
          response.end(JSON.stringify({ version, code }));
        } catch (error) {
          response.statusCode = 500;
          response.end(error instanceof Error ? error.message : 'compile failed');
        }
      });
    },
  };
}
