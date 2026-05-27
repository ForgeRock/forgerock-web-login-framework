/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function importSubject() {
  const { widgetApiFactory } = await import('./widget.api');
  const { componentApi } = await import('./_utilities/component.utilities');
  return widgetApiFactory(componentApi());
}

const validJourneyClient = {
  serverConfig: { wellknown: 'https://example.com/.well-known/openid-configuration' },
};

function readStore<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let captured!: T;
  store.subscribe((value) => {
    captured = value;
  })();
  return captured;
}

describe('widgetApiFactory', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('pre-configuration guards', () => {
    it('journey() throws when called before configuration()', async () => {
      const api = await importSubject();
      expect(() => api.journey()).toThrow('Error: missing configuration.');
    });

    it('user.info() throws when called before configuration()', async () => {
      const api = await importSubject();
      expect(() => api.user.info()).toThrow('Error: missing configuration.');
    });
  });

  describe('configuration() without journeyClient', () => {
    it('exposes a usable journeyStore — its initial value is observable via subscribe', async () => {
      const api = await importSubject();
      api.configuration();
      const { journeyStore } = api.getStores();

      const value = readStore(journeyStore);
      expect(value).toMatchObject({
        completed: false,
        error: null,
        loading: false,
        step: null,
        successful: false,
      });
    });

    it('journeyStore.reset() does not throw — the regression that broke user.logout()', async () => {
      const api = await importSubject();
      api.configuration();
      const { journeyStore } = api.getStores();
      expect(() => journeyStore.reset()).not.toThrow();
    });
  });

  describe('configuration().set()', () => {
    it('set({ journeyClient }) after configuration() without journeyClient enables journey() to be called', async () => {
      const api = await importSubject();
      api.configuration().set({ journeyClient: validJourneyClient });

      expect(() => api.journey()).not.toThrow();
    });

    it('set() without journeyClient preserves a previously configured journey client', async () => {
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient }).set();

      expect(() => api.journey()).not.toThrow();
    });
  });
});
