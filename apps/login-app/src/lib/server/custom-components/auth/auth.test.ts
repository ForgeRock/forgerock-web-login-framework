/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { it } from '@effect/vitest';
import { ConfigProvider, Effect, Layer, Option } from 'effect';
import { describe, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$core/constants', () => ({ AM_COOKIE_NAME: 'iPlanetDirectoryPro' }));

import { AM_COOKIE_NAME } from '$core/constants';
import { Auth, AuthLive, extractSessionToken } from './auth';

import type { AuthUser } from '../shared';
import type { AmSessionReader, ComponentAuthError } from './auth';
import type { AmSession } from '$server/sessions';

/** A config provider carrying the given ORIGIN (absent = unconfigured, the fail-closed path). */
const configLayer = (origin?: string) =>
  Layer.setConfigProvider(ConfigProvider.fromMap(new Map(origin ? [['ORIGIN', origin]] : [])));

const adminReader: AmSessionReader = () =>
  Promise.resolve({
    userId: 'admin-user',
    roles: ['ui-realm-admin'],
    unreachable: false,
  } satisfies AmSession);

const enduserReader: AmSessionReader = () =>
  Promise.resolve({
    userId: 'regular-user',
    roles: ['ui-enduser'],
    unreachable: false,
  } satisfies AmSession);

const failingReader: AmSessionReader = () => Promise.reject(new Error('AM down'));

const authenticateWith = (reader: AmSessionReader, request: Request, origin?: string) =>
  Effect.flatMap(Auth, (authenticate) => authenticate(request)).pipe(
    Effect.provide(AuthLive(reader)),
    Effect.provide(configLayer(origin)),
  );

/** Runs an authentication effect, moving its error into the success channel for assertions. */
const runAuth = (reader: AmSessionReader, request: Request, origin?: string) =>
  Effect.flip(authenticateWith(reader, request, origin));

describe('extractSessionToken', () => {
  it('reads a bearer token', () => {
    const request = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer am-token-123' },
    });
    expect(Option.getOrNull(extractSessionToken(request))).toBe('am-token-123');
  });

  it('reads the AM session cookie when no bearer token is present', () => {
    const request = new Request('http://localhost/api', {
      headers: { cookie: 'other=1; ' + AM_COOKIE_NAME + '=cookie-token; x=2' },
    });
    expect(Option.getOrNull(extractSessionToken(request))).toBe('cookie-token');
  });

  it('prefers the bearer token over the cookie', () => {
    const request = new Request('http://localhost/api', {
      headers: {
        authorization: 'Bearer header-token',
        cookie: `${AM_COOKIE_NAME}=cookie-token`,
      },
    });
    expect(Option.getOrNull(extractSessionToken(request))).toBe('header-token');
  });

  it('returns none when neither credential is present', () => {
    const request = new Request('http://localhost/api');
    expect(Option.isNone(extractSessionToken(request))).toBe(true);
  });

  it('returns none when the bearer credential is empty', () => {
    // Headers trims trailing whitespace, so 'Bearer ' arrives as 'Bearer' — a header
    // that does not match the 'Bearer ' scheme and no cookie, which must be none.
    const request = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer ' },
    });
    expect(Option.isNone(extractSessionToken(request))).toBe(true);
  });

  it('returns none for a bearer header without the scheme prefix', () => {
    const request = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer' },
    });
    expect(Option.isNone(extractSessionToken(request))).toBe(true);
  });
});

describe('AuthLive', () => {
  it.effect('authenticates an AM admin session from a bearer token', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost/api/components/callbacks', {
        method: 'POST',
        headers: { authorization: 'Bearer am-token' },
      });
      const user: AuthUser = yield* authenticateWith(adminReader, request);
      expect(user.uid).toBe('admin-user');
    }),
  );

  it.effect('authenticates an AM admin session from the session cookie', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost/api/components/callbacks', {
        method: 'GET',
        headers: { cookie: `${AM_COOKIE_NAME}=cookie-token` },
      });
      const user: AuthUser = yield* authenticateWith(adminReader, request);
      expect(user.uid).toBe('admin-user');
    }),
  );

  it.effect('fails unauthenticated when no credential is present', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost/api/components/callbacks');
      const error: ComponentAuthError = yield* runAuth(adminReader, request);
      expect(error._tag).toBe('AuthUnauthenticatedError');
    }),
  );

  it.effect('fails unauthenticated when AM rejects the session', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost/api/components/callbacks', {
        headers: { authorization: 'Bearer invalid' },
      });
      const rejectingReader: AmSessionReader = () =>
        Promise.resolve({ userId: null, roles: [], unreachable: false } satisfies AmSession);
      const error: ComponentAuthError = yield* runAuth(rejectingReader, request);
      expect(error._tag).toBe('AuthUnauthenticatedError');
    }),
  );

  it.effect('fails forbidden for a valid session without an admin role', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost/api/components/callbacks', {
        headers: { authorization: 'Bearer enduser-token' },
      });
      const error = yield* Effect.flip(authenticateWith(enduserReader, request));
      if (error._tag !== 'AuthForbiddenError') {
        return yield* Effect.die(new Error(`Expected AuthForbiddenError, got ${error._tag}`));
      }
      expect(error.uid).toBe('regular-user');
    }),
  );

  it.effect('fails unavailable when AM cannot be reached', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost/api/components/callbacks', {
        headers: { authorization: 'Bearer any' },
      });
      const error: ComponentAuthError = yield* runAuth(failingReader, request);
      expect(error._tag).toBe('AuthUnavailableError');
    }),
  );

  it.effect('rejects a mutating cookie-carried request whose origin does not match', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost:3000/api/components/callbacks', {
        method: 'POST',
        headers: {
          cookie: `${AM_COOKIE_NAME}=cookie-token`,
          origin: 'http://evil.example',
        },
      });
      const error: ComponentAuthError = yield* runAuth(
        adminReader,
        request,
        'http://localhost:3000',
      );
      expect(error._tag).toBe('AuthForbiddenError');
      expect(error._tag === 'AuthForbiddenError' && error.uid).toBe('admin-user');
    }),
  );

  it.effect(
    'fails closed for a mutating cookie-carried request when ORIGIN is not configured',
    () =>
      Effect.gen(function* () {
        const request = new Request('http://localhost:3000/api/components/callbacks', {
          method: 'POST',
          headers: {
            cookie: `${AM_COOKIE_NAME}=cookie-token`,
            origin: 'http://localhost:3000',
          },
        });
        const error: ComponentAuthError = yield* runAuth(adminReader, request);
        expect(error._tag).toBe('AuthUnavailableError');
      }),
  );

  it.effect('allows a mutating cookie-carried request with a matching origin', () =>
    Effect.gen(function* () {
      const request = new Request('http://localhost:3000/api/components/callbacks', {
        method: 'POST',
        headers: {
          cookie: `${AM_COOKIE_NAME}=cookie-token`,
          origin: 'http://localhost:3000',
        },
      });
      const user: AuthUser = yield* authenticateWith(adminReader, request, 'http://localhost:3000');
      expect(user.uid).toBe('admin-user');
    }),
  );
});
