import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// Demo-only local write endpoint: saves the Monaco editor's current Svelte
// source back to the real repo folder the framework's Vite plugin watches
// (experimental/custom/callbacks/<name>/ or experimental/custom/stages/<name>/),
// so the running login-app/widget picks up the edit. `kind` and `name` come
// from the request body (the editor sends the entry's own `kind`/`saveName`),
// so both are validated server-side before touching the filesystem — this is
// a rough local demo tool, not a general file-write API.
const CUSTOM_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../custom');

const KIND_TO_DIR: Record<'callback' | 'stage', string> = {
  callback: 'callbacks',
  stage: 'stages',
};

const NAME_PATTERN = /^[a-z0-9-]+$/;

function resolveSaveTarget(kind: unknown, name: unknown): string | undefined {
  if (kind !== 'callback' && kind !== 'stage') {
    return undefined;
  }
  if (typeof name !== 'string' || !NAME_PATTERN.test(name)) {
    return undefined;
  }

  const targetPath = path.resolve(CUSTOM_ROOT, KIND_TO_DIR[kind], name, `${name}.svelte`);

  // Belt-and-suspenders: NAME_PATTERN already forbids `/` and `..`, but this
  // confirms the resolved path never escapes experimental/custom/ before we
  // write to disk.
  if (!targetPath.startsWith(`${CUSTOM_ROOT}${path.sep}`)) {
    return undefined;
  }

  return targetPath;
}

function saveCustomComponentPlugin(): Plugin {
  return {
    name: 'save-custom-component',
    configureServer(server) {
      server.middlewares.use('/api/save-custom-component', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end('Method Not Allowed');
          return;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of request) {
          chunks.push(chunk as Buffer);
        }
        const body = Buffer.concat(chunks).toString('utf-8');

        let kind: unknown;
        let name: unknown;
        let source: unknown;
        try {
          ({ kind, name, source } = JSON.parse(body));
        } catch {
          response.statusCode = 400;
          response.end('Invalid JSON body');
          return;
        }

        if (typeof source !== 'string') {
          response.statusCode = 400;
          response.end('Missing source');
          return;
        }

        const targetPath = resolveSaveTarget(kind, name);
        if (!targetPath) {
          response.statusCode = 400;
          response.end('Invalid kind or name');
          return;
        }

        try {
          await writeFile(targetPath, source, 'utf-8');
          response.statusCode = 200;
          response.end('ok');
        } catch (error) {
          response.statusCode = 500;
          response.end(error instanceof Error ? error.message : 'write failed');
        }
      });
    },
  };
}

// css.postcss is set explicitly so Vite doesn't crawl up into the monorepo
// root's postcss.config.cjs (its tailwind config path resolves relative to
// that root, not this standalone dir, and crashes).
export default defineConfig({
  css: {
    postcss: {
      plugins: [],
    },
  },
  plugins: [saveCustomComponentPlugin()],
});
