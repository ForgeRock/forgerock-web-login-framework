/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { buildEnterpriseScriptSrc } from './recaptcha-enterprise.utilities';

describe('buildEnterpriseScriptSrc', () => {
  it('appends ?render=siteKey for invisible mode', () => {
    expect(
      buildEnterpriseScriptSrc({
        apiUrl: 'https://www.google.com/recaptcha/enterprise.js',
        siteKey: 'test-site-key',
        mode: 'invisible',
      }),
    ).toBe('https://www.google.com/recaptcha/enterprise.js?render=test-site-key');
  });

  it('does not append ?render for visible mode', () => {
    expect(
      buildEnterpriseScriptSrc({
        apiUrl: 'https://www.google.com/recaptcha/enterprise.js',
        siteKey: 'test-site-key',
        mode: 'visible',
      }),
    ).toBe('https://www.google.com/recaptcha/enterprise.js');
  });
});
