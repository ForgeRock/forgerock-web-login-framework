import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// Demo-only local write endpoint: saves the Monaco editor's current Svelte
// source for the "custom-name.svelte (repo, unmodified)" entry back to the
// real repo file the framework's Vite plugin watches, so the running
// login-app/widget picks up the edit. Target path is fixed server-side (not
// taken from the request) — this is a rough local demo tool, not a general
// file-write API.
const SAVE_TARGET_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../custom/callbacks/custom-name/custom-name.svelte',
);

function saveCustomNamePlugin(): Plugin {
  return {
    name: 'save-custom-name',
    configureServer(server) {
      server.middlewares.use('/api/save-custom-name', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end('Method Not Allowed');
          return;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of request) {
          chunks.push(chunk as Buffer);
        }
        const source = Buffer.concat(chunks).toString('utf-8');

        try {
          await writeFile(SAVE_TARGET_PATH, source, 'utf-8');
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
  plugins: [saveCustomNamePlugin()],
});
