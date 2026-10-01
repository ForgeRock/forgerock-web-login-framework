/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));

const hoistedEnv = vi.hoisted(() => ({
  values: { ORIGIN: undefined as string | undefined },
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy(hoistedEnv.values, {
    get: (target, property) => {
      if (property === 'ORIGIN') {
        return target.ORIGIN;
      }
      const fallback: Record<string, string> = {
        FR_AM_URL: 'https://am.example.com/am',
        FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
        FR_REALM_PATH: 'root',
      };
      return (
        Reflect.get(process.env as Record<string, string | undefined>, property) ??
        fallback[String(property)]
      );
    },
  }),
}));

import { Effect } from 'effect';

import { AM_COOKIE_NAME } from '$core/constants';
import { ComponentAuth, extractSessionToken } from './auth';

import type { AmSessionDependencies } from './auth';

const adminDependencies: AmSessionDependencies = {
  getUserId: () => Promise.resolve('admin-user'),
  getRoles: async () => Promise.resolve(['ui-realm-admin']),
};

const enduserDependencies: AmSessionDependencies = {
  getUserId: () => Promise.resolve('regular-user'),
  getRoles: async () => Promise.resolve(['ui-enduser']),
};

const failingDependencies: AmSessionDependencies = {
  getUserId: () => Promise.reject(new Error('AM down')),
  getRoles: async () => Promise.resolve([]),
};

const authenticateWith = (dependencies: AmSessionDependencies, request: Request) =>
  Effect.provide(
    Effect.flatMap(ComponentAuth, (auth) => auth.authenticate(request)),
    ComponentAuth.layer(dependencies),
  );

describe('extractSessionToken', () => {
  it('reads a bearer token', () => {
    const request = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer am-token-123' },
    });
    expect(extractSessionToken(request)).toBe('am-token-123');
  });

  it('reads the AM session cookie when no bearer token is present', () => {
    const request = new Request('http://localhost/api', {
      headers: { cookie: 'other=1; ' + AM_COOKIE_NAME + '=cookie-token; x=2' },
    });
    expect(extractSessionToken(request)).toBe('cookie-token');
  });

  it('prefers the bearer token over the cookie', () => {
    const request = new Request('http://localhost/api', {
      headers: {
        authorization: 'Bearer header-token',
        cookie: `${AM_COOKIE_NAME}=cookie-token`,
      },
    });
    expect(extractSessionToken(request)).toBe('header-token');
  });

  it('returns null when neither credential is present', () => {
    const request = new Request('http://localhost/api');
    expect(extractSessionToken(request)).toBeNull();
  });

  it('returns null for an empty bearer value', () => {
    const request = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer ' },
    });
    expect(extractSessionToken(request)).toBeNull();
  });
});

describe('ComponentAuth.layer', () => {
  it('authenticates an AM admin session from a bearer token', async () => {
    const request = new Request('http://localhost/api/components/callbacks', {
      method: 'POST',
      headers: { authorization: 'Bearer am-token' },
    });
    const user = await Effect.runPromise(authenticateWith(adminDependencies, request));
    expect(user.uid).toBe('admin-user');
  });

  it('authenticates an AM admin session from the session cookie', async () => {
    const request = new Request('http://localhost/api/components/callbacks', {
      method: 'GET',
      headers: { cookie: `${AM_COOKIE_NAME}=cookie-token` },
    });
    const user = await Effect.runPromise(authenticateWith(adminDependencies, request));
    expect(user.uid).toBe('admin-user');
  });

  it('fails unauthenticated when no credential is present', async () => {
    const request = new Request('http://localhost/api/components/callbacks');
    const result = await Effect.runPromise(
      Effect.either(authenticateWith(adminDependencies, request)),
    );
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left.reason).toBe('Unauthenticated');
    }
  });

  it('fails unauthenticated when AM rejects the session', async () => {
    const request = new Request('http://localhost/api/components/callbacks', {
      headers: { authorization: 'Bearer invalid' },
    });
    const rejectingDependencies: AmSessionDependencies = {
      getUserId: () => Promise.resolve(null),
      getRoles: async () => Promise.resolve([]),
    };
    const result = await Effect.runPromise(
      Effect.either(authenticateWith(rejectingDependencies, request)),
    );
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left.reason).toBe('Unauthenticated');
    }
  });

  it('fails forbidden for a valid session without an admin role', async () => {
    const request = new Request('http://localhost/api/components/callbacks', {
      headers: { authorization: 'Bearer enduser-token' },
    });
    const result = await Effect.runPromise(
      Effect.either(authenticateWith(enduserDependencies, request)),
    );
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left.reason).toBe('Forbidden');
    }
  });

  it('fails unavailable when AM cannot be reached', async () => {
    const request = new Request('http://localhost/api/components/callbacks', {
      headers: { authorization: 'Bearer any' },
    });
    const result = await Effect.runPromise(
      Effect.either(authenticateWith(failingDependencies, request)),
    );
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left.reason).toBe('Unavailable');
    }
  });

  it('rejects a mutating cookie-carried request whose origin does not match', async () => {
    const previousOrigin = process.env.ORIGIN;
    hoistedEnv.values.ORIGIN = 'http://localhost:3000';
    try {
      const request = new Request('http://localhost:3000/api/components/callbacks', {
        method: 'POST',
        headers: {
          cookie: `${AM_COOKIE_NAME}=cookie-token`,
          origin: 'http://evil.example',
        },
      });
      const result = await Effect.runPromise(
        Effect.either(authenticateWith(adminDependencies, request)),
      );
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.reason).toBe('Forbidden');
      }
    } finally {
      if (previousOrigin === undefined) {
        delete process.env.ORIGIN;
      } else {
        process.env.ORIGIN = previousOrigin;
      }
    }
  });

  it('fails closed for a mutating cookie-carried request when ORIGIN is not configured', async () => {
    const previousOrigin = process.env.ORIGIN;
    hoistedEnv.values.ORIGIN = undefined;
    try {
      const request = new Request('http://localhost/api/components/callbacks', {
        method: 'POST',
        headers: {
          cookie: `${AM_COOKIE_NAME}=cookie-token`,
          origin: 'http://localhost:3000',
        },
      });
      const result = await Effect.runPromise(
        Effect.either(authenticateWith(adminDependencies, request)),
      );
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.reason).toBe('Unavailable');
      }
    } finally {
      if (previousOrigin === undefined) {
        delete process.env.ORIGIN;
      } else {
        process.env.ORIGIN = previousOrigin;
      }
    }
  });

  it('allows a mutating cookie-carried request with a matching origin', async () => {
    const previousOrigin = process.env.ORIGIN;
    hoistedEnv.values.ORIGIN = 'http://localhost:3000';
    try {
      const request = new Request('http://localhost:3000/api/components/callbacks', {
        method: 'POST',
        headers: {
          cookie: `${AM_COOKIE_NAME}=cookie-token`,
          origin: 'http://localhost:3000',
        },
      });
      const user = await Effect.runPromise(authenticateWith(adminDependencies, request));
      expect(user.uid).toBe('admin-user');
    } finally {
      hoistedEnv.values.ORIGIN = previousOrigin;
    }
  });
});
