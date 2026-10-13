import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

import SelectIdp from './select-idp.svelte';

import type { SelectIdPCallback } from '@forgerock/journey-client/types';
import type { Component } from 'svelte';

function renderIdps(providers: unknown, inputValue = '') {
  const setProvider = vi.fn();
  const callback = {
    getProviders: () => providers,
    getInputValue: () => inputValue,
    setProvider,
  } as unknown as SelectIdPCallback;

  const { body } = render(SelectIdp as Component, {
    props: {
      callback,
      callbackMetadata: null,
      stepMetadata: null,
    },
  });

  return { body, setProvider };
}

const buttonCount = (body: string) => body.match(/<button/g)?.length ?? 0;

describe('SelectIdP generic fallback', () => {
  it('renders two custom IdPs as buttons with labels', () => {
    const { body } = renderIdps([
      { provider: 'custom-acme', uiConfig: { buttonDisplayName: 'Acme Corp' } },
      { provider: 'custom-globex', uiConfig: { buttonDisplayName: 'Globex' } },
    ]);
    expect(body).toContain('Acme Corp');
    expect(body).toContain('Globex');
    expect(body).toContain('Continue With');
    expect(buttonCount(body)).toBe(2);
  });

  it('keeps known-brand styling and hides localAuthentication', () => {
    const { body } = renderIdps([
      { provider: 'google-web', uiConfig: { buttonDisplayName: 'Google' } },
      { provider: 'localAuthentication' },
    ]);
    expect(body).toContain('Google');
    expect(body).toContain('tw_button-google');
    expect(body).not.toContain('localAuthentication');
    expect(buttonCount(body)).toBe(1);
  });

  it('falls back to provider id for blank or missing display name', () => {
    const { body } = renderIdps([
      { provider: 'custom-blank-id', uiConfig: { buttonDisplayName: '   ' } },
      { provider: 'custom-missing-id' },
    ]);
    expect(body).toContain('custom-blank-id');
    expect(body).toContain('custom-missing-id');
    expect(buttonCount(body)).toBe(2);
  });

  it('does not overwrite preselected social provider with local default', () => {
    const { body, setProvider } = renderIdps(
      [
        { provider: 'custom-acme', uiConfig: { buttonDisplayName: 'Acme Corp' } },
        { provider: 'localAuthentication' },
      ],
      'custom-acme',
    );
    expect(setProvider).not.toHaveBeenCalledWith('localAuthentication');
    expect(body).toContain('Acme Corp');
    expect(buttonCount(body)).toBe(1);
  });
});
