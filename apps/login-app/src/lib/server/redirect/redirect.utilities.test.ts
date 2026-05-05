/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import {
  isDefaultPath,
  parseRedirectForm,
  resolveAgainstOrigin,
  resolveRedirect,
} from './redirect.utilities';

import type { RedirectData } from './redirect.types';

describe('parseRedirectForm', () => {
  it('parses expected values', () => {
    const formData = new FormData();
    formData.append('loginResult', 'success');
    formData.append('tokenId', 'abc123');
    formData.append('journeyStepUrl', '/am/json/realms/root/authenticate');

    expect(parseRedirectForm(formData)).toEqual({
      loginResult: 'success',
      tokenId: 'abc123',
      journeyStepUrl: '/am/json/realms/root/authenticate',
    });
  });

  it('defaults loginResult to failure when invalid', () => {
    const formData = new FormData();
    formData.append('loginResult', 'nope');
    formData.append('tokenId', 'abc123');
    formData.append('journeyStepUrl', '/am/json/realms/root/authenticate');

    expect(parseRedirectForm(formData).loginResult).toBe('failure');
  });

  it('coerces missing form fields to empty strings', () => {
    const formData = new FormData();
    formData.append('loginResult', 'success');

    expect(parseRedirectForm(formData)).toEqual({
      loginResult: 'success',
      tokenId: '',
      journeyStepUrl: '',
    });
  });
});

describe('isDefaultPath', () => {
  it('returns false for nullish/empty values', () => {
    expect(isDefaultPath(null)).toBe(false);
    expect(isDefaultPath(undefined)).toBe(false);
    expect(isDefaultPath('')).toBe(false);
  });

  it("returns true when the last segment is 'console'", () => {
    expect(isDefaultPath('/platform/console')).toBe(true);
    expect(isDefaultPath('/platform/console/')).toBe(true);
    expect(isDefaultPath('/platform/console?realm=/alpha')).toBe(true);
    expect(isDefaultPath('https://example.com/platform/console?x=1#hash')).toBe(true);
  });

  it("returns false when the last segment isn't 'console'", () => {
    expect(isDefaultPath('/platform/consoleX')).toBe(false);
    expect(isDefaultPath('/platform')).toBe(false);
    expect(isDefaultPath('https://example.com/platform/consoleX')).toBe(false);
  });
});

describe('resolveAgainstOrigin', () => {
  it('resolves relative paths against a provided origin', () => {
    const resolved = resolveAgainstOrigin('/enduser/?realm=/alpha', 'https://openam.example.com');
    expect(resolved).toBe('https://openam.example.com/enduser/?realm=/alpha');
  });

  it('keeps absolute URLs absolute', () => {
    const resolved = resolveAgainstOrigin(
      'https://forgerock.github.io/',
      'https://openam.example.com',
    );
    expect(resolved).toBe('https://forgerock.github.io/');
  });

  it('returns the original input when resolution fails', () => {
    expect(resolveAgainstOrigin('/enduser/?realm=/alpha', 'not-a-valid-origin')).toBe(
      '/enduser/?realm=/alpha',
    );

    expect(resolveAgainstOrigin('http://[::1', 'https://example.com')).toBe('http://[::1');
  });
});

describe('resolveRedirect', () => {
  const makeContext = (overrides: Partial<RedirectData> = {}): RedirectData => ({
    tokenId: '' as RedirectData['tokenId'],
    journeyStepUrl: '',
    isGotoOnFail: false,
    gotoUrl: '',
    successUrl: null,
    roles: [],
    realm: 'root',
    amOrigin: 'https://openam.example.com',
    ...overrides,
  });

  it('uses successUrl when it is provided and not a default path', () => {
    const url = resolveRedirect(makeContext({ successUrl: '/enduser' }));
    expect(url).toBe('https://openam.example.com/enduser');
  });

  it('falls back to journeyStepUrl when successUrl is a default path', () => {
    const url = resolveRedirect(
      makeContext({
        successUrl: '/platform/console',
        journeyStepUrl: '/am/json/realms/root/authenticate',
      }),
    );
    expect(url).toBe('https://openam.example.com/am/json/realms/root/authenticate');
  });

  it('prefers journeyStepUrl over SAML gotoUrl when successUrl is default but journeyStepUrl is not', () => {
    const url = resolveRedirect(
      makeContext({
        successUrl: '/platform/console',
        journeyStepUrl: '/am/json/realms/root/authenticate',
        gotoUrl: '/saml2/idp/SSO',
      }),
    );
    expect(url).toBe('https://openam.example.com/am/json/realms/root/authenticate');
  });

  it('uses SAML gotoUrl when successUrl is a default path and gotoUrl looks like SAML', () => {
    const url = resolveRedirect(
      makeContext({
        successUrl: '/platform/console',
        journeyStepUrl: '/platform/console',
        gotoUrl: '/saml2/idp/SSO',
      }),
    );
    expect(url).toBe('https://openam.example.com/saml2/idp/SSO');
  });

  it('uses SAML gotoUrl when it contains /Consumer/metaAlias', () => {
    const url = resolveRedirect(
      makeContext({
        successUrl: '/platform/console',
        journeyStepUrl: '/platform/console',
        gotoUrl: '/Consumer/metaAlias/idp?x=1',
      }),
    );
    expect(url).toBe('https://openam.example.com/Consumer/metaAlias/idp?x=1');
  });

  it('uses journeyStepUrl when provided and no higher-priority redirect matches', () => {
    const url = resolveRedirect(makeContext({ journeyStepUrl: '/journey/step/1' }));
    expect(url).toBe('https://openam.example.com/journey/step/1');
  });

  it('returns a role-based redirect for admins when eligible', () => {
    const url = resolveRedirect(
      makeContext({
        tokenId: 'abc123' as RedirectData['tokenId'],
        roles: ['ui-global-admin'],
        realm: 'alpha',
      }),
    );
    expect(url).toBe('https://openam.example.com/platform/?realm=/alpha');
  });

  it('returns a role-based redirect for non-admin users when eligible', () => {
    const url = resolveRedirect(
      makeContext({
        tokenId: 'abc123' as RedirectData['tokenId'],
        roles: ['some-role'],
        realm: 'root',
      }),
    );
    expect(url).toBe('https://openam.example.com/enduser/?realm=/#/');
  });

  it('does not return role redirects when gotoOnFail is set', () => {
    const url = resolveRedirect(
      makeContext({
        isGotoOnFail: true,
        tokenId: 'abc123' as RedirectData['tokenId'],
        roles: ['ui-global-admin'],
      }),
    );
    expect(url).toBe('/failure-redirect');
  });

  it('prefers successUrl over role-based redirects when both are eligible', () => {
    const url = resolveRedirect(
      makeContext({
        successUrl: '/enduser',
        tokenId: 'abc123' as RedirectData['tokenId'],
        roles: ['ui-global-admin'],
        realm: 'alpha',
      }),
    );
    expect(url).toBe('https://openam.example.com/enduser');
  });

  it('returns a failure fallback redirect when gotoOnFail is set', () => {
    const url = resolveRedirect(makeContext({ isGotoOnFail: true }));
    expect(url).toBe('/failure-redirect');
  });

  it('returns a success fallback redirect when nothing matches', () => {
    const url = resolveRedirect(makeContext());
    expect(url).toBe('/success-redirect');
  });
});
