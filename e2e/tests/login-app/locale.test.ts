/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

/**
 * api/locale is login-app's own delta over core's getLocale: it resolves against
 * $app-locales (ca/en, ca/fr, us/es — login-app's own catalogs) before falling back to
 * $locales (core, us/en only). Page-load locale resolution isn't tested here because it
 * resolves against $locales exclusively, which ships only us/en, so that branch can't vary.
 */
test('Accept-Language: fr-CA resolves to the $app-locales/ca/fr catalog', async ({ request }) => {
  const response = await request.get('/api/locale', {
    headers: { 'accept-language': 'fr-CA' },
  });
  const body = await response.json();

  expect(body.closeModal).toBe('Fermer Modal');
  expect(body.alreadyHaveAnAccount).toContain('Vous avez déjà un compte');
});

test('Accept-Language: en-CA resolves to the $app-locales/ca/en catalog', async ({ request }) => {
  const response = await request.get('/api/locale', {
    headers: { 'accept-language': 'en-CA' },
  });
  const body = await response.json();

  expect(body.closeModal).toBe('Close Modal');
});

test('Accept-Language: es-US resolves to the $app-locales/us/es catalog', async ({ request }) => {
  const response = await request.get('/api/locale', {
    headers: { 'accept-language': 'es-US' },
  });
  const body = await response.json();

  expect(body.closeModal).toBe('Ventana Emergente');
  expect(body.alreadyHaveAnAccount).toContain('Tiene una cuenta?');
});

test('An unsupported locale falls back to $locales/us/en', async ({ request }) => {
  const response = await request.get('/api/locale', {
    headers: { 'accept-language': 'xx-XX' },
  });
  const body = await response.json();

  expect(body.closeModal).toBe('Close');
  expect(body.alreadyHaveAnAccount).toContain('Already have an account');
});
