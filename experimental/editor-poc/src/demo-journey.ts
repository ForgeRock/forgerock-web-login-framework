/**
 * `journey` prop mock for the editor preview (IAM-12011 finding T6).
 *
 * Stages receive a StageJourneyObject (core/journey/journey.interfaces.ts)
 * built by core/journey/journey.svelte from the journey store. The demos used
 * to pass `{ loading: false }`, so a component calling journey.push/pop/
 * redirect/restart, or reading journey.stack (BackTo, captureLinks), threw in
 * the preview but worked in production. This factory satisfies the full
 * contract with logging no-ops; the typed return keeps it from drifting.
 *
 * Imported by the preview mount wrapper only (compiler.ts getMountCode), not
 * exposed on `$login-framework`, so authored code cannot import it.
 */
import { get, writable } from 'svelte/store';

import type { StageJourneyObject } from '../../../core/journey/journey.interfaces';

type StartParam = Parameters<StageJourneyObject['push']>[0];

interface DemoJourneyOptions {
  readonly loading?: boolean;
  readonly log?: (...details: unknown[]) => void;
}

export function createDemoJourney(options: DemoJourneyOptions = {}): StageJourneyObject {
  const { loading = false, log = (...details: unknown[]) => console.log(...details) } = options;
  const entries = writable<StartParam[]>([]);

  const stack: StageJourneyObject['stack'] = {
    subscribe: entries.subscribe,
    latest: async () => get(entries).at(-1),
    pop: async () => {
      entries.update((current) => current.slice(0, -1));
      return get(entries);
    },
    push: async (entry) => {
      entries.update((current) => (entry ? [...current, entry] : current));
      return get(entries);
    },
    reset: () => entries.set([]),
  };

  return {
    loading,
    pop: () => {
      log('journey.pop');
      void stack.pop();
    },
    push: (params) => {
      log('journey.push', params);
      void stack.push(params);
    },
    redirect: async (step) => {
      log('journey.redirect', step);
    },
    restart: async () => {
      log('journey.restart');
    },
    stack,
  };
}
