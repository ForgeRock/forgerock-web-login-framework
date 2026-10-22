import { svelte } from '@sveltejs/vite-plugin-svelte';
import { realpathSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

import { widgetCompilePlugin } from './src/proof/widget-compile-plugin';

// Demo-only local write endpoint: saves the Monaco editor's current Svelte
// source back to the real repo folder the framework's Vite plugin watches
// (experimental/custom/callbacks/<name>/ or experimental/custom/stages/<name>/),
// so the running login-app/widget picks up the edit. `kind` and `name` come
// from the request body (the editor sends the entry's own `kind`/`saveName`),
// so both are validated server-side before touching the filesystem — this is
// a rough local demo tool, not a general file-write API.
const POC_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(POC_DIR, '../..');
const CUSTOM_ROOT = path.resolve(POC_DIR, '../custom');

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

        // `server.cors: true` makes every route readable from any origin, which
        // also makes this write endpoint drivable from any open web page. The
        // opaque-origin preview iframe sends `Origin: null` (legitimate author
        // traffic); anything else that presents an Origin must match the dev
        // server's own origin. Same-origin editor requests send no Origin at all.
        const requestOrigin = request.headers.origin;
        const devServerOrigin = `http://localhost:${server.config.server.port ?? 5173}`;
        if (requestOrigin && requestOrigin !== devServerOrigin) {
          response.statusCode = 403;
          response.end('Forbidden');
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

// The preview sandbox needs `@forgerock/sdk-types` (for the real `callbackType`
// const object — see src/framework-stubs/journey-client-mock.ts), but pnpm's
// isolated layout hides it inside journey-client's .pnpm context: it is not
// resolvable from editor-poc or the repo root. Resolve it through
// journey-client's realpath, mirroring how journey-client itself imports it.
function resolveSdkTypesPath(): string {
  const repoRequire = createRequire(path.join(REPO_ROOT, 'package.json'));
  // Resolve journey-client's package.json (not its entry module) so the
  // realpath lands on the package root inside journey-client's .pnpm context;
  // sdk-types sits as a SIBLING of journey-client under that context's
  // node_modules/@forgerock/ (pnpm co-location), not under journey-client's
  // own nested node_modules.
  const journeyClientPkg = realpathSync(
    repoRequire.resolve('@forgerock/journey-client/package.json'),
  );
  return path.resolve(path.dirname(journeyClientPkg), '..', 'sdk-types');
}

// The preview needs journey-client's callback factory for the types shim, but
// the package's exports map blocks deep imports. Resolve it through
// journey-client's realpath like resolveSdkTypesPath does.
function resolveJourneyClientFactoryPath(): string {
  const repoRequire = createRequire(path.join(REPO_ROOT, 'package.json'));
  const journeyClientPkg = realpathSync(
    repoRequire.resolve('@forgerock/journey-client/package.json'),
  );
  return path.resolve(path.dirname(journeyClientPkg), 'dist/src/lib/callbacks/factory.js');
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
  plugins: [
    // Compiles the REAL core/ .svelte components the $login-framework surface
    // re-exports, when the preview sandbox fetches them via /@fs/ URLs. Same
    // compiler options the login-widget build uses, so preview output matches
    // the published widget's runtime behavior (componentApi: 4).
    svelte({
      configFile: false,
      compilerOptions: {
        dev: false,
        compatibility: { componentApi: 4 },
        css: 'injected',
      },
    }),
    saveCustomComponentPlugin(),
    widgetCompilePlugin(REPO_ROOT),
  ],
  resolve: {
    alias: {
      // Same aliases as packages/login-widget/vite.config.ts — the preview
      // resolves the framework surface to real core/ sources, never dist.
      $core: path.resolve(REPO_ROOT, 'core'),
      $components: path.resolve(REPO_ROOT, 'core/components'),
      $journey: path.resolve(REPO_ROOT, 'core/journey'),
      $locales: path.resolve(REPO_ROOT, 'core/locales'),
      // Journey-client boundary mock: the AM journey request is the ONE thing
      // the preview fakes (IAM-12011 scope). See src/framework-stubs/. The
      // `./types` subpath maps to a runtime SHIM (not a stub): the real
      // `./types` export is a .d.ts only, but core/'s step.mock.ts imports
      // createCallback (runtime callback construction) through it — the shim
      // re-exports the real factory machinery so mock journeys build.
      '@forgerock/journey-client/webauthn': path.resolve(
        POC_DIR,
        'src/framework-stubs/webauthn-stub.ts',
      ),
      '@forgerock/journey-client/device': path.resolve(
        POC_DIR,
        'src/framework-stubs/device-stub.ts',
      ),
      '@forgerock/journey-client/types': path.resolve(
        POC_DIR,
        'src/framework-stubs/journey-client-types-shim.ts',
      ),
      '@forgerock/journey-client': path.resolve(
        POC_DIR,
        'src/framework-stubs/journey-client-mock.ts',
      ),
      '@forgerock/protect': path.resolve(POC_DIR, 'src/framework-stubs/protect-stub.ts'),
      '@forgerock/sdk-types': resolveSdkTypesPath(),
      // The shim's deep import into journey-client's factory (blocked by the
      // package's exports map).
      '#journey-client-factory': resolveJourneyClientFactoryPath(),
    },
  },
  server: {
    // The preview iframe is sandbox="allow-scripts" WITHOUT allow-same-origin
    // (opaque origin), so it cannot make same-origin requests. Module fetches
    // from `Origin: null` are simple GETs, so `cors: true` (ACAO: *) is what
    // lets the sandbox import real dev-server modules. This loosens module
    // *supply* only — the origin boundary of the sandbox itself is unchanged.
    cors: true,
    host: '127.0.0.1',
    // HMR machinery (/@vite/client websocket) is meaningless inside the
    // opaque sandboxed iframe and noisy in the parent; the editor re-renders
    // via postMessage and a page reload picks up parent-side edits.
    hmr: false,
    fs: {
      // Scope module serving to the directories the preview actually needs —
      // without this, cors:true would expose the whole monorepo to any origin.
      // node_modules is included so the PARENT app's own deps (Monaco's codicon
      // font) keep loading; the sandbox iframe only imports core/,
      // experimental/, and packages/ (the widget runtime API surface,
      // src/preview-framework.ts).
      allow: [
        path.resolve(REPO_ROOT, 'core'),
        path.resolve(REPO_ROOT, 'experimental'),
        path.resolve(REPO_ROOT, 'packages'),
        path.resolve(REPO_ROOT, 'node_modules'),
      ],
    },
  },
});
