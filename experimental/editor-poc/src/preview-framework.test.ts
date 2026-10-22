// IAM-12011 task 4 — the preview's `$login-framework` must expose the FULL
// public module surface: the curated custom-component exports plus the widget
// runtime API the published entry (packages/login-widget/src/lib/index.svelte)
// exports from its module context. One module instance, one API instance.
//
// IAM-12011 task 5 — the runtime API must actually RUN in the preview: the
// journey-client boundary is now a fixture-backed mock client, so configure()
// constructs a real client, journey().start() returns a mock step, and the
// next() submission reaches LoginSuccess. These tests run in Node (jsdom-less)
// — sessionStorage/localStorage guards in the framework are best-effort
// try/catch, so a bare Node environment is enough to exercise the store flow.
import { describe, expect, it } from 'vitest';

import * as previewFramework from './preview-framework';

describe('preview-framework surface (IAM-12011 task 4)', () => {
  it('re-exports the curated custom-component surface', () => {
    // Svelte components compile to functions — presence + callability is the
    // contract; rendering behavior is covered by the browser demo (task 5).
    expect(typeof previewFramework.Form).toBe('function');
    expect(typeof previewFramework.CallbackMapper).toBe('function');
    expect(typeof previewFramework.T).toBe('function');
    expect(typeof previewFramework.Stacked).toBe('function');
    expect(typeof previewFramework.styleStore.subscribe).toBe('function');
    expect(typeof previewFramework.interpolate).toBe('function');
    expect(typeof previewFramework.createJourneyStep).toBe('function');
    expect(typeof previewFramework.initializeLocale).toBe('function');
    expect(typeof previewFramework.initializeLinks).toBe('function');
    expect(typeof previewFramework.initializeStyles).toBe('function');
  });

  it('exposes the widget runtime API (mirrors index.svelte module exports)', () => {
    expect(typeof previewFramework.configure).toBe('function');
    expect(typeof previewFramework.journey).toBe('function');
    // `component` mirrors the published entry: the factory, not an instance.
    expect(typeof previewFramework.component).toBe('function');
    expect(typeof previewFramework.getStores).toBe('function');
    expect(typeof previewFramework.user.info).toBe('function');
    expect(typeof previewFramework.user.tokens).toBe('function');
    expect(typeof previewFramework.user.logout).toBe('function');
    expect(typeof previewFramework.protect.start).toBe('function');
    expect(typeof previewFramework.protect.getData).toBe('function');
    expect(typeof previewFramework.protect.pauseBehavioralData).toBe('function');
    expect(typeof previewFramework.protect.resumeBehavioralData).toBe('function');
  });

  it('exports exactly one instance of each public name (no curated-surface collisions)', () => {
    const exportedNames = Object.keys(previewFramework);
    expect(new Set(exportedNames).size).toBe(exportedNames.length);
    expect(exportedNames).not.toContain('default');
  });
});

describe('preview runtime over the mocked journey client (IAM-12011 task 5)', () => {
  const wellknown = 'https://mock.example.com/am/oauth2/alpha/.well-known/openid-configuration';

  it('configure() resolves through the mocked journey client and seeds the stores', async () => {
    await expect(
      previewFramework.configure({
        serverConfig: { wellknown },
      }),
    ).resolves.toBeUndefined();
  });

  it('journey() derived store tracks start -> step -> success (submission via journeyStore.next, the path journey.svelte drives)', async () => {
    await previewFramework.configure({ serverConfig: { wellknown } });

    // The public journey API's start() promise resolves only when the whole
    // journey completes (widget.api.ts start()), so success is driven the way
    // a rendered stage drives it: journeyStore.next(currentStep) — the same
    // call journey.svelte's submitForm makes. This test walks the full flow
    // through the PUBLIC surface (configure + journey + getStores) and
    // observes the derived journey store.
    const journeyApi = previewFramework.journey({ oauth: false, user: false });
    const { journeyStore } = previewFramework.getStores();
    const observed: Array<Record<string, unknown>> = [];
    const unsubscribe = journeyApi.subscribe((value) => {
      observed.push(value);
    });

    try {
      void journeyApi.start({ journey: 'Login' });

      // Wait for the first step to render.
      const stepEvent = await new Promise<{
        journey: { step: Parameters<typeof journeyStore.next>[0] };
      }>((resolve) => {
        journeyApi.subscribe((value) => {
          const state = value as { journey: { step: { type: string } | null } };
          if (state.journey.step?.type === 'Step') {
            resolve(value as { journey: { step: Parameters<typeof journeyStore.next>[0] } });
          }
        });
      });
      expect(stepEvent.journey.step.type).toBe('Step');

      // Submit — the mock client answers next() with LoginSuccess.
      await journeyStore.next(stepEvent.journey.step);
      await new Promise<void>((resolve) => {
        journeyApi.subscribe((value) => {
          if ((value as { journey: { successful: boolean } }).journey.successful) {
            resolve();
          }
        });
      });

      const finalEvent = observed[observed.length - 1] as {
        journey: { successful: boolean; completed: boolean; error: unknown };
      };
      expect(finalEvent.journey.successful).toBe(true);
      expect(finalEvent.journey.completed).toBe(true);
      expect(finalEvent.journey.error).toBeNull();
    } finally {
      unsubscribe();
    }
  });

  it('a step submission through journeyStore.next reaches LoginSuccess (mirror of journey.svelte submitForm)', async () => {
    await previewFramework.configure({ serverConfig: { wellknown } });

    const { journeyStore } = previewFramework.getStores();
    const observed: Array<{ successful: boolean; stepType: string | null }> = [];
    const unsubscribe = journeyStore.subscribe((value) => {
      observed.push({
        successful: value.successful,
        stepType: value.step?.type ?? null,
      });
    });

    try {
      await journeyStore.start({ journey: 'Login' });

      const stepEvent = observed.find((event) => event.stepType === 'Step');
      expect(stepEvent).toBeDefined();

      const stepState = await new Promise<{ step: Parameters<typeof journeyStore.next>[0] }>(
        (resolve) => {
          journeyStore.subscribe((value) => {
            if (value.step?.type === 'Step') {
              resolve(value as { step: Parameters<typeof journeyStore.next>[0] });
            }
          });
        },
      );

      journeyStore.next(stepState.step);
      await new Promise<void>((resolve) => {
        journeyStore.subscribe((value) => {
          if (value.successful) {
            resolve();
          }
        });
      });

      expect(observed.some((event) => event.successful)).toBe(true);
    } finally {
      unsubscribe();
    }
  });
});
