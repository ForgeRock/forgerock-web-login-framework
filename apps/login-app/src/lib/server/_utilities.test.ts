/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import {
  extractDomainFromUrl,
  getRedirectUrlBasedOnRole,
  isDefaultPath,
  isSamlURL,
  parseRedirectForm,
  resolveAgainstOrigin,
  rewriteCookieForClient,
  rewriteCookieForServer,
} from './_utilities';

describe('Domain utilities should work as expected', () => {
  it('should extract the domain out of a full URL', () => {
    const domain = extractDomainFromUrl('https://openam-sdks.forgeblocks.com/am/');
    expect(domain).toBe('openam-sdks.forgeblocks.com');
  });

  it('should extract the domain out of a development URL', () => {
    const domain = extractDomainFromUrl('https://dev.example.com:8080/am/');
    expect(domain).toBe('dev.example.com');
  });

  it('should extract the localhost out of a development URL', () => {
    const domain = extractDomainFromUrl('localhost:8080/am/');
    expect(domain).toBe('localhost');
  });
});

describe('Cookies should be rewritten for entity', () => {
  it('should convert server cookie to client cookie', () => {
    const clientCookie = rewriteCookieForClient({
      cookie:
        'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=openam-sdks.forgeblocks.com; Secure; HttpOnly; SameSite=none',
      amDomain: 'openam-sdks.forgeblocks.com',
      appDomain: 'localhost',
    });
    console.log(clientCookie);
    expect(clientCookie).toBe(
      'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=localhost; Secure; HttpOnly; SameSite=none',
    );
  });

  it('should convert client cookie to server cookie', () => {
    const serverCookie = rewriteCookieForServer({
      cookie:
        'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=localhost; Secure; HttpOnly; SameSite=none',
      amDomain: 'openam-sdks.forgeblocks.com',
      appDomain: 'localhost',
    });
    console.log(serverCookie);
    expect(serverCookie).toBe(
      'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=openam-sdks.forgeblocks.com; Secure; HttpOnly; SameSite=none',
    );
  });
});

describe('Redirect utilities should work as expected', () => {
  it('should parse a redirect form with expected values', () => {
    const formData = new FormData();
    formData.append('loginResult', 'success');
    formData.append('tokenId', 'abc123');
    formData.append('journeyStepUrl', '/am/json/realms/root/authenticate');

    const parsed = parseRedirectForm(formData);
    expect(parsed).toEqual({
      loginResult: 'success',
      tokenId: 'abc123',
      journeyStepUrl: '/am/json/realms/root/authenticate',
    });
  });

  it('should default loginResult to failure when invalid', () => {
    const formData = new FormData();
    formData.append('loginResult', 'nope');
    formData.append('tokenId', 'abc123');
    formData.append('journeyStepUrl', '/am/json/realms/root/authenticate');

    const parsed = parseRedirectForm(formData);
    expect(parsed.loginResult).toBe('failure');
  });

  it('should coerce missing redirect form fields to empty strings', () => {
    const formData = new FormData();
    formData.append('loginResult', 'success');

    const parsed = parseRedirectForm(formData);
    expect(parsed).toEqual({
      loginResult: 'success',
      tokenId: '',
      journeyStepUrl: '',
    });
  });

  it('should detect default console paths', () => {
    expect(isDefaultPath(null)).toBe(false);
    expect(isDefaultPath(undefined)).toBe(false);
    expect(isDefaultPath('')).toBe(false);

    expect(isDefaultPath('/platform/console')).toBe(true);
    expect(isDefaultPath('/platform/console/')).toBe(true);
    expect(isDefaultPath('/platform/console?realm=/alpha')).toBe(true);
    expect(isDefaultPath('https://example.com/platform/console?x=1#hash')).toBe(true);

    expect(isDefaultPath('/platform/consoleX')).toBe(false);
    expect(isDefaultPath('/platform')).toBe(false);
  });

  it('should detect SAML URLs', () => {
    expect(isSamlURL('/am/Consumer/metaAlias/realm/sp')).toBe(true);
    expect(isSamlURL('/am/saml2/jsp/idpSingleSignOnInit.jsp')).toBe(true);
    expect(isSamlURL('/am/oauth2/authorize')).toBe(false);
  });

  it('should build redirect URLs based on role and realm', () => {
    const amOrigin = 'https://openam-sdks.forgeblocks.com';

    expect(getRedirectUrlBasedOnRole(amOrigin, ['ui-global-admin'], 'alpha')).toBe(
      'https://openam-sdks.forgeblocks.com/platform/?realm=/alpha',
    );

    expect(getRedirectUrlBasedOnRole(amOrigin, ['ui-realm-admin'], 'root')).toBe(
      'https://openam-sdks.forgeblocks.com/platform/?realm=/',
    );

    expect(getRedirectUrlBasedOnRole(amOrigin, [], 'alpha')).toBe(
      'https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/',
    );

    expect(getRedirectUrlBasedOnRole(amOrigin, [], '')).toBe(
      'https://openam-sdks.forgeblocks.com/enduser/?realm=/#/',
    );
  });

  it('should resolve a relative url against an origin', () => {
    const resolved = resolveAgainstOrigin(
      '/enduser/?realm=/alpha',
      'https://openam-sdks.forgeblocks.com',
    );
    expect(resolved).toBe('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha');
  });

  it('should keep an absolute url absolute', () => {
    const resolved = resolveAgainstOrigin(
      'https://forgerock.github.io/',
      'https://openam-sdks.forgeblocks.com',
    );
    expect(resolved).toBe('https://forgerock.github.io/');
  });

  it('should return the original input when resolution fails', () => {
    expect(resolveAgainstOrigin('/enduser/?realm=/alpha', 'not-a-valid-origin')).toBe(
      '/enduser/?realm=/alpha',
    );

    expect(resolveAgainstOrigin('http://[::1', 'https://example.com')).toBe('http://[::1');
  });
});
