/* eslint-disable svelte/no-svelte-internal -- the proof deliberately forwards Svelte's internal runtime to injected components */
// IAM-12011 T5 proof page. Tests, in a real browser with real module loading,
// the assumptions behind the reply on the shared-instance question. The page
// has NO import map.
//
//   P1   A fetched module with bare imports cannot load without an import map.
//   P2   The injected-framework mechanism works, and the component reads the
//        host's framework instance (stores are shared, not copied).
//   P3*  A component running on a second Svelte runtime, while using framework
//        components compiled for the first, breaks or misbehaves. Components
//        for the second runtime are compiled by the matching 5.53.7 compiler
//        so only the cross-runtime effect is measured.
//   P4*  Output compiled by the editor's Svelte 5.57.2 fails on the widget's
//        5.53.7 runtime (control: the matching compiler works).
//
// Results land in window.__proofResults for the automated check.
import 'svelte/internal/disclose-version';
import 'svelte/internal/flags/legacy';
import * as hostSvelte from 'svelte';
import { VERSION as editorCompilerVersion } from 'svelte/compiler';
import * as hostSvelteInternalClient from 'svelte/internal/client';
import * as hostSvelteLegacy from 'svelte/legacy';
import * as hostSvelteStore from 'svelte/store';

import { compileComponent } from '../compiler';
import { rewriteImportsToInjection } from '../inject-framework';

// Spike constraint, same as main-monaco.ts FRAMEWORK_ENTRY_PATH: /@fs/ URLs
// need machine-absolute paths.
const REPOSITORY_ROOT = '/Users/gabrielstein/Documents/projects/login-framework';
const CURATED_SURFACE_URL = `/@fs${REPOSITORY_ROOT}/experimental/custom/login-framework.ts`;
const WIDGET_SVELTE_SOURCE = `/@fs${REPOSITORY_ROOT}/node_modules/.pnpm/svelte@5.53.7/node_modules/svelte/src`;

interface ProofResult {
  readonly id: string;
  readonly assumption: string;
  readonly observed: string;
  readonly assumptionHolds: boolean;
}

interface Outcome<T> {
  readonly value: T | null;
  readonly thrown: string | null;
  readonly logged: readonly string[];
}

type UnknownRecord = Record<string, unknown>;
type Compile = (source: string) => Promise<string>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const readFunction = (source: unknown, name: string): ((...args: unknown[]) => unknown) => {
  const candidate = isRecord(source) ? source[name] : undefined;
  if (typeof candidate !== 'function') {
    throw new Error(`Expected function export "${name}"`);
  }
  return (...args: unknown[]) => Reflect.apply(candidate, undefined, args);
};

const readString = (source: unknown, name: string): string => {
  const candidate = isRecord(source) ? source[name] : undefined;
  return typeof candidate === 'string' ? candidate : 'unknown';
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const loadModule = (code: string): Promise<unknown> => {
  const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  return import(/* @vite-ignore */ url);
};

const loadFactory = async (code: string): Promise<(framework: UnknownRecord) => unknown> =>
  readFunction(await loadModule(code), 'default');

const rewriteOrThrow = (compiledJs: string): string => {
  const rewritten = rewriteImportsToInjection(compiledJs);
  if (rewritten.kind === 'error') {
    throw new Error(rewritten.message);
  }
  return rewritten.code;
};

const compileWithEditorCompiler: Compile = async (source) => {
  const compiled = compileComponent(source);
  if (compiled.error !== null) {
    throw new Error(compiled.error);
  }
  return compiled.js;
};

// Runs a step while capturing console.error output, which Svelte uses for
// runtime problems that do not throw.
const observe = async <T>(step: () => Promise<T>): Promise<Outcome<T>> => {
  const logged: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    logged.push(args.map(String).join(' '));
  };
  try {
    return { value: await step(), thrown: null, logged };
  } catch (error) {
    return { value: null, thrown: errorMessage(error), logged };
  } finally {
    console.error = originalError;
  }
};

const describeOutcome = (outcome: Outcome<string>): string => {
  if (outcome.thrown !== null) {
    return `threw (${outcome.thrown.split('\n')[0]})`;
  }
  const logs = outcome.logged.length > 0 ? `, console.error: ${outcome.logged.join(' | ')}` : '';
  return `no throw, result="${outcome.value ?? ''}"${logs}`;
};

const isClean = (outcome: Outcome<string>, expected: string): boolean =>
  outcome.thrown === null && outcome.logged.length === 0 && outcome.value === expected;

const createStage = (label: string): HTMLElement => {
  const stage = document.createElement('section');
  const heading = document.createElement('h3');
  heading.textContent = label;
  const target = document.createElement('div');
  stage.append(heading, target);
  document.getElementById('stages')?.append(stage);
  return target;
};

const SOURCE_FRAMEWORK_STATIC = `<script>
  import { Button, T } from '$login-framework';
</script>
<Button><T key="loginHeader" /></Button>`;

const SOURCE_FRAMEWORK_REACTIVE = `<script>
  import { onMount } from 'svelte';
  import { T } from '$login-framework';
  let count = 0;
  let mounted = 'no';
  onMount(() => { mounted = 'yes'; });
</script>
<T key="loginHeader" />
<button data-proof="inc" on:click={() => count++}>inc</button>
<p data-proof="state">count={count} mounted={mounted}</p>`;

const SOURCE_PLAIN = `<script>
  import { onMount } from 'svelte';
  let count = 0;
  onMount(() => { count = 1; });
</script>
<p data-proof="plain">count={count}</p>`;

// The widget's compiler runs in the dev server (see widget-compile-plugin.ts).
const compileWithWidgetCompiler = async (
  source: string,
): Promise<{ readonly version: string; readonly code: string }> => {
  const response = await fetch('/api/compile-with-widget-svelte', {
    method: 'POST',
    body: JSON.stringify({ source }),
  });
  const body: unknown = await response.json();
  if (!response.ok || !isRecord(body)) {
    throw new Error(`Widget compile failed (${response.status})`);
  }
  return { version: readString(body, 'version'), code: readString(body, 'code') };
};

interface WidgetToolchain {
  readonly runtime: UnknownRecord;
  readonly runtimeVersion: string;
  readonly compilerVersion: string;
  readonly compile: Compile;
}

// The widget's own Svelte (5.53.7): runtime modules plus the matching compiler,
// imported from the pnpm store by path so they are a SECOND copy next to the
// editor's 5.57.2.
const importWidgetToolchain = async (): Promise<WidgetToolchain> => {
  const [svelteModule, storeModule, legacyModule, internalClientModule, versionModule] =
    await Promise.all([
      import(/* @vite-ignore */ `${WIDGET_SVELTE_SOURCE}/index-client.js`),
      import(/* @vite-ignore */ `${WIDGET_SVELTE_SOURCE}/store/index-client.js`),
      import(/* @vite-ignore */ `${WIDGET_SVELTE_SOURCE}/legacy/legacy-client.js`),
      import(/* @vite-ignore */ `${WIDGET_SVELTE_SOURCE}/internal/client/index.js`),
      import(/* @vite-ignore */ `${WIDGET_SVELTE_SOURCE}/version.js`),
      import(/* @vite-ignore */ `${WIDGET_SVELTE_SOURCE}/internal/disclose-version.js`),
      import(/* @vite-ignore */ `${WIDGET_SVELTE_SOURCE}/internal/flags/legacy.js`),
    ]);
  const compilerProbe = await compileWithWidgetCompiler('<p>probe</p>');
  return {
    runtime: {
      svelte: svelteModule,
      'svelte/store': storeModule,
      'svelte/legacy': legacyModule,
      'svelte/internal/client': internalClientModule,
    },
    runtimeVersion: readString(versionModule, 'VERSION'),
    compilerVersion: compilerProbe.version,
    compile: async (source) => (await compileWithWidgetCompiler(source)).code,
  };
};

const hostRuntime: UnknownRecord = {
  svelte: hostSvelte,
  'svelte/store': hostSvelteStore,
  'svelte/legacy': hostSvelteLegacy,
  'svelte/internal/client': hostSvelteInternalClient,
};

const buildComponent = async (
  compile: Compile,
  source: string,
  framework: UnknownRecord,
): Promise<unknown> => (await loadFactory(rewriteOrThrow(await compile(source))))(framework);

const mountWith = async (
  svelteModule: unknown,
  component: unknown,
  label: string,
): Promise<HTMLElement> => {
  const target = createStage(label);
  readFunction(svelteModule, 'mount')(component, { target });
  await readFunction(svelteModule, 'tick')();
  return target;
};

const textOf = (element: Element): string => element.textContent?.trim().replace(/\s+/g, ' ') ?? '';

const clickAndRead = async (
  svelteModule: unknown,
  target: HTMLElement,
): Promise<{ readonly before: string; readonly after: string }> => {
  const state = target.querySelector('[data-proof="state"]');
  const before = state ? textOf(state) : 'missing state element';
  target.querySelector<HTMLButtonElement>('[data-proof="inc"]')?.click();
  await readFunction(svelteModule, 'tick')();
  return { before, after: state ? textOf(state) : 'missing state element' };
};

const proofImportMapIsRequired = async (): Promise<ProofResult> => {
  const outcome = await observe(async () =>
    loadModule(await compileWithEditorCompiler(SOURCE_FRAMEWORK_STATIC)),
  );
  return {
    id: 'P1',
    assumption:
      'A fetched module that still has bare imports cannot load in a page without an import map',
    observed: outcome.thrown ?? 'module loaded without error',
    assumptionHolds: outcome.thrown !== null && /specifier/i.test(outcome.thrown),
  };
};

const proofInjectionSharesHostInstance = async (
  curatedSurface: UnknownRecord,
): Promise<ProofResult> => {
  const framework = { ...hostRuntime, '$login-framework': curatedSurface };
  const component = await buildComponent(
    compileWithEditorCompiler,
    SOURCE_FRAMEWORK_STATIC,
    framework,
  );

  const initializeLocale = readFunction(curatedSurface, 'initializeLocale');
  initializeLocale();
  const first = await mountWith(hostSvelte, component, 'P2 first mount (default locale)');
  initializeLocale({ loginHeader: 'Changed by the host' });
  const second = await mountWith(
    hostSvelte,
    component,
    'P2 second mount (host changed locale store)',
  );

  return {
    id: 'P2',
    assumption:
      'With injection the component renders framework components and reads the host instance of the framework stores',
    observed: `first mount text="${textOf(first)}", framework button present=${
      first.querySelector('button') !== null
    }; after the host changed its locale store, a new mount shows "${textOf(second)}"`,
    assumptionHolds:
      textOf(first) === 'Sign in' &&
      first.querySelector('button') !== null &&
      textOf(second) === 'Changed by the host',
  };
};

const proofSecondRuntime = async (
  curatedSurface: UnknownRecord,
  toolchain: WidgetToolchain,
): Promise<readonly ProofResult[]> => {
  readFunction(curatedSurface, 'initializeLocale')();
  const mixedFramework = { ...toolchain.runtime, '$login-framework': curatedSurface };
  const versions = `components compiled by ${toolchain.compilerVersion} for runtime ${toolchain.runtimeVersion}, framework surface compiled for ${editorCompilerVersion}`;

  const island = await observe(async () => {
    const component = await buildComponent(
      toolchain.compile,
      SOURCE_FRAMEWORK_STATIC,
      mixedFramework,
    );
    return textOf(
      await mountWith(
        toolchain.runtime.svelte,
        component,
        'P3a island: mounted by the second runtime',
      ),
    );
  });

  const nestedStatic = await observe(async () => {
    const component = await buildComponent(
      toolchain.compile,
      SOURCE_FRAMEWORK_STATIC,
      mixedFramework,
    );
    return textOf(
      await mountWith(hostSvelte, component, 'P3b nested: mounted by the host runtime, static'),
    );
  });

  const nestedReactive = await observe(async () => {
    const component = await buildComponent(
      toolchain.compile,
      SOURCE_FRAMEWORK_REACTIVE,
      mixedFramework,
    );
    const target = await mountWith(
      hostSvelte,
      component,
      'P3c nested: mounted by the host runtime, reactive',
    );
    const { before, after } = await clickAndRead(hostSvelte, target);
    return `${before} -> after click: ${after}`;
  });

  const control = await observe(async () => {
    const component = await buildComponent(compileWithEditorCompiler, SOURCE_FRAMEWORK_REACTIVE, {
      ...hostRuntime,
      '$login-framework': curatedSurface,
    });
    const target = await mountWith(
      hostSvelte,
      component,
      'P3-control: one runtime throughout, reactive',
    );
    const { before, after } = await clickAndRead(hostSvelte, target);
    return `${before} -> after click: ${after}`;
  });

  const reactiveExpected = 'Sign in inc count=0 mounted=yes -> after click: count=1 mounted=yes';
  return [
    {
      id: 'P3a',
      assumption: `A component that brings its own Svelte runtime and mounts itself, using framework components compiled for another runtime, breaks (${versions})`,
      observed: describeOutcome(island),
      assumptionHolds: !isClean(island, 'Sign in'),
    },
    {
      id: 'P3b',
      assumption: 'The same component mounted under the host runtime still breaks (static render)',
      observed: describeOutcome(nestedStatic),
      assumptionHolds: !isClean(nestedStatic, 'Sign in'),
    },
    {
      id: 'P3c',
      assumption:
        'Mounted under the host runtime, reactivity or lifecycle across the runtime boundary breaks',
      observed: describeOutcome(nestedReactive),
      assumptionHolds: !(
        nestedReactive.thrown === null &&
        nestedReactive.logged.length === 0 &&
        nestedReactive.value?.endsWith('after click: count=1 mounted=yes') === true
      ),
    },
    {
      id: 'P3-control',
      assumption: 'Control: with one runtime throughout, the same component is reactive and clean',
      observed: describeOutcome(control),
      assumptionHolds:
        control.thrown === null &&
        control.logged.length === 0 &&
        control.value?.endsWith(reactiveExpected.slice(reactiveExpected.indexOf('->'))) === true,
    },
  ];
};

const proofVersionSkew = async (toolchain: WidgetToolchain): Promise<readonly ProofResult[]> => {
  const skewed = await observe(async () => {
    const component = await buildComponent(
      compileWithEditorCompiler,
      SOURCE_PLAIN,
      toolchain.runtime,
    );
    return textOf(
      await mountWith(
        toolchain.runtime.svelte,
        component,
        'P4 compiled by editor 5.57.2, run on widget 5.53.7',
      ),
    );
  });
  const matched = await observe(async () => {
    const component = await buildComponent(toolchain.compile, SOURCE_PLAIN, toolchain.runtime);
    return textOf(
      await mountWith(
        toolchain.runtime.svelte,
        component,
        'P4-control compiled by 5.53.7, run on 5.53.7',
      ),
    );
  });
  return [
    {
      id: 'P4',
      assumption: `Compiled output is coupled to the runtime version: output from the editor compiler (${editorCompilerVersion}) can fail on the widget runtime (${toolchain.runtimeVersion})`,
      observed: describeOutcome(skewed),
      assumptionHolds: !isClean(skewed, 'count=1'),
    },
    {
      id: 'P4-control',
      assumption: 'Control: output from the matching compiler runs on the widget runtime',
      observed: describeOutcome(matched),
      assumptionHolds: isClean(matched, 'count=1'),
    },
  ];
};

const renderResults = (results: readonly ProofResult[]): void => {
  const table = document.getElementById('results');
  if (!table) {
    return;
  }
  table.innerHTML = results
    .map(
      (result) =>
        `<tr data-proof-id="${result.id}" data-holds="${result.assumptionHolds}"><td>${
          result.id
        }</td><td>${result.assumption}</td><td>${result.observed}</td><td>${
          result.assumptionHolds ? 'HOLDS' : 'REFUTED'
        }</td></tr>`,
    )
    .join('');
};

const runProofs = async (): Promise<void> => {
  const curatedSurface = await import(/* @vite-ignore */ CURATED_SURFACE_URL);
  const toolchain = await importWidgetToolchain();
  const steps: readonly (() => Promise<readonly ProofResult[]>)[] = [
    async () => [await proofImportMapIsRequired()],
    async () => [await proofInjectionSharesHostInstance(curatedSurface)],
    () => proofSecondRuntime(curatedSurface, toolchain),
    () => proofVersionSkew(toolchain),
  ];
  const results = await steps.reduce<Promise<readonly ProofResult[]>>(
    async (previous, step, index) => {
      const accumulated = await previous;
      const stepResults = await step().catch((error: unknown): readonly ProofResult[] => [
        {
          id: `step-${index + 1}-error`,
          assumption: 'proof step ran',
          observed: errorMessage(error),
          assumptionHolds: false,
        },
      ]);
      return [...accumulated, ...stepResults];
    },
    Promise.resolve([]),
  );
  renderResults(results);
  Object.assign(window, { __proofResults: results, __proofDone: true });
};

void runProofs().catch((error: unknown) => {
  Object.assign(window, {
    __proofResults: [],
    __proofDone: true,
    __proofFatal: errorMessage(error),
  });
});
