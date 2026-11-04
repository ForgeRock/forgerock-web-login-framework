/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'alpha',
  },
}));

import {
  amFetchRequest,
  fetchAm,
  getAmCookie,
  resolveJsonRealmPath,
  resolveOAuthRealmPath,
  setAmCookie,
  upstreamFailureResponse,
} from './sessions';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function cookies(values: Record<string, string> = {}) {
  return {
    get: (name: string) => values[name],
    getAll: () => Object.entries(values).map(([name, value]) => ({ name, value })),
    serialize: (name: string, value: string) => `${name}=${value}`,
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as {
    get: (name: string) => string | undefined;
    getAll: () => Array<{ name: string; value: string }>;
    serialize: (name: string, value: string) => string;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

describe('Login2 session cookie forwarding', () => {
  it('forwards only the configured AM cookie', () => {
    expect(getAmCookie(cookies({ iPlanetDirectoryPro: 'session-token', other: 'ignored' }))).toBe(
      'iPlanetDirectoryPro=session-token',
    );
  });

  it('stores an upstream AM cookie without its upstream domain', () => {
    const target = cookies();

    setAmCookie(
      target,
      'iPlanetDirectoryPro=session-token; Path=/; Domain=am.example.com; Secure; HttpOnly',
    );

    expect(target.set).toHaveBeenCalledWith('iPlanetDirectoryPro', 'session-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });

  it('clears an upstream AM cookie with an empty value', () => {
    const target = cookies();

    setAmCookie(target, 'iPlanetDirectoryPro=; Path=/; Max-Age=0');

    expect(target.delete).toHaveBeenCalledWith('iPlanetDirectoryPro', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });

  it('forwards Max-Age from the upstream cookie without Domain or Expires', () => {
    const target = cookies();

    setAmCookie(
      target,
      'iPlanetDirectoryPro=session-token; Path=/; Max-Age=1800; Domain=am.example.com; Secure; HttpOnly',
    );

    expect(target.set.mock.calls[0]).toEqual([
      'iPlanetDirectoryPro',
      'session-token',
      { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 1800 },
    ]);
  });

  it('forwards Expires as a Date when Max-Age is absent', () => {
    const target = cookies();

    setAmCookie(
      target,
      'iPlanetDirectoryPro=session-token; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Secure; HttpOnly',
    );

    expect(target.set.mock.calls[0]).toEqual([
      'iPlanetDirectoryPro',
      'session-token',
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: new Date('Wed, 21 Oct 2026 07:28:00 GMT'),
      },
    ]);
  });

  it('prefers Max-Age over Expires when both attributes are present', () => {
    const target = cookies();

    setAmCookie(
      target,
      'iPlanetDirectoryPro=session-token; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Max-Age=1800',
    );

    expect(target.set.mock.calls[0]).toEqual([
      'iPlanetDirectoryPro',
      'session-token',
      { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 1800 },
    ]);
  });

  it('falls back to a session cookie when persistence attributes are malformed', () => {
    const target = cookies();

    setAmCookie(
      target,
      'iPlanetDirectoryPro=session-token; Path=/; Max-Age=abc; Expires=not-a-date; Secure; HttpOnly',
    );

    expect(target.set.mock.calls[0]).toEqual([
      'iPlanetDirectoryPro',
      'session-token',
      { httpOnly: true, sameSite: 'lax', secure: true, path: '/' },
    ]);
  });

  it('reads the AM cookie out of a multi-cookie header with Expires dates', () => {
    const target = cookies();

    setAmCookie(
      target,
      'other=abc; Expires=Wed, 21 Oct 2026 07:28:00 GMT, iPlanetDirectoryPro=session-token; Path=/; Expires=Thu, 22 Oct 2026 07:28:00 GMT',
    );

    expect(target.set.mock.calls[0]).toEqual([
      'iPlanetDirectoryPro',
      'session-token',
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: new Date('Thu, 22 Oct 2026 07:28:00 GMT'),
      },
    ]);
  });
});

describe('Login2 realm paths', () => {
  it('uses the configured realm when no override is provided', () => {
    expect(resolveJsonRealmPath()).toBe('/json/realms/root/realms/alpha');
  });

  it('supports root and named realm overrides', () => {
    expect(resolveJsonRealmPath('/')).toBe('/json/realms/root');
    expect(resolveJsonRealmPath('/bravo')).toBe('/json/realms/root/realms/bravo');
    expect(resolveOAuthRealmPath('/bravo')).toBe('/oauth2/realms/root/realms/bravo');
  });

  it('uses the root realm for explicit root overrides', () => {
    expect(resolveJsonRealmPath('/')).toBe('/json/realms/root');
    expect(resolveJsonRealmPath('/root')).toBe('/json/realms/root');
  });

  it('rejects path traversal and falls back for malformed overrides', () => {
    expect(resolveJsonRealmPath('../../global-config')).toBe('/json/realms/root/realms/alpha');
    expect(resolveJsonRealmPath('alpha/../bravo')).toBe('/json/realms/root/realms/alpha');
  });
});

describe('Login2 AM fetch transport', () => {
  it('forwards the URL and init to fetch and returns the buffered upstream exchange', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('{"ok":true}', { status: 200, statusText: 'OK' }));
    vi.stubGlobal('fetch', fetch);

    const upstream = await fetchAm('https://am.example.com/am/json/ping', {
      method: 'POST',
      headers: { accept: 'application/json' },
      body: 'payload',
    });

    expect(upstream.kind).toBe('response');
    if (upstream.kind !== 'response') return;
    expect(upstream.status).toBe(200);
    expect(upstream.ok).toBe(true);
    expect(upstream.body).toBe('{"ok":true}');
    expect(upstream.headers.get('content-type')).toContain('text/plain');
    expect(fetch.mock.calls[0][0]).toBe('https://am.example.com/am/json/ping');
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { accept: 'application/json' },
      body: 'payload',
    });
    expect((fetch.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it('returns a null body for bodyless statuses so the proxy can rebuild the Response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response(null, { status: 204 })),
    );

    const upstream = await fetchAm('https://am.example.com/am/json/ping');

    expect(upstream.kind).toBe('response');
    if (upstream.kind !== 'response') return;
    expect(upstream.status).toBe(204);
    expect(upstream.ok).toBe(true);
    expect(upstream.body).toBeNull();
    // The proxy pattern must not throw: the Response constructor rejects a
    // non-null body for 204/205/304.
    expect(() => new Response(upstream.body, { status: upstream.status })).not.toThrow();
  });

  it.each([205, 304])('maps status %i to a null body as well', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response(null, { status })),
    );

    const upstream = await fetchAm('https://am.example.com/am/json/ping');

    expect(upstream.kind).toBe('response');
    if (upstream.kind !== 'response') return;
    expect(upstream.body).toBeNull();
  });

  it('keeps an empty string body for statuses that allow one', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response('', { status: 200 })),
    );

    const upstream = await fetchAm('https://am.example.com/am/json/ping');

    expect(upstream.kind).toBe('response');
    if (upstream.kind !== 'response') return;
    expect(upstream.body).toBe('');
  });

  it('aborts the request after the AM timeout', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    vi.stubGlobal('fetch', fetch);

    // Attach the rejection assertion before the timer fires so the rejection is
    // never unhandled while fake timers advance.
    const pending = fetchAm('https://am.example.com/am/json/ping');
    await vi.advanceTimersByTimeAsync(2000);
    const upstream = await pending;

    expect(upstream.kind).toBe('failure');
    if (upstream.kind !== 'failure') return;
    expect(upstream.reason).toBe('timeout');
  });

  it('classifies a connection refusal as a network failure, not a timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed: ECONNREFUSED')));

    const upstream = await fetchAm('https://am.example.com/am/json/ping');

    expect(upstream.kind).toBe('failure');
    if (upstream.kind !== 'failure') return;
    expect(upstream.reason).toBe('network');
    expect(upstream.error).toBeInstanceOf(Error);
  });

  it('aborts a stalled response body even when the headers arrive in time', async () => {
    vi.useFakeTimers();
    // Headers resolve immediately, but the body stream never delivers a chunk:
    // with the timer disarmed at headers this would pin the request open.
    // A real undici fetch terminates the body when its signal aborts, so the
    // mock mirrors that contract: the stream's pull rejects on abort.
    let onAbort: (() => void) | undefined;
    const stalledBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"partial":'));
        onAbort = () => controller.error(new Error('The operation was aborted'));
      },
    });
    const fetch = vi.fn((_url: string, init?: RequestInit) => {
      init?.signal?.addEventListener('abort', () => onAbort?.(), { once: true });
      return Promise.resolve(
        new Response(stalledBody, {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetch);

    const pending = fetchAm('https://am.example.com/am/json/ping');
    await vi.advanceTimersByTimeAsync(2000);
    const upstream = await pending;

    expect(upstream.kind).toBe('failure');
    if (upstream.kind !== 'failure') return;
    expect(upstream.reason).toBe('timeout');
  });

  it('maps a timeout failure to a 504 with a JSON upstream_timeout body', () => {
    const response = upstreamFailureResponse({
      kind: 'failure',
      reason: 'timeout',
      error: new Error('aborted'),
    });

    expect(response.status).toBe(504);
    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('maps a network failure to a 502 with a JSON upstream_unavailable body', () => {
    const response = upstreamFailureResponse({
      kind: 'failure',
      reason: 'network',
      error: new TypeError('fetch failed: ECONNREFUSED'),
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).toBe('application/json');
  });
});

describe('Root redirect validation transport', () => {
  it.each(['/', 'root', '/root'])('uses the root action alias for %s only', async (realm) => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ successURL: '/platform/' }));
    vi.stubGlobal('fetch', fetch);

    await amFetchRequest(
      'abc123' as Parameters<typeof amFetchRequest>[0],
      '/users?_action=validateGoto',
      'POST',
      { goto: '/platform/' },
      realm,
    );

    expect(fetch.mock.calls[0][0]).toBe(
      'https://am.example.com/am/json/users?_action=validateGoto',
    );
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { cookie: 'iPlanetDirectoryPro=abc123' },
      body: JSON.stringify({ goto: '/platform/' }),
    });
  });

  it('preserves the qualified root path for other AM operations', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ valid: true }));
    vi.stubGlobal('fetch', fetch);

    await amFetchRequest(
      'abc123' as Parameters<typeof amFetchRequest>[0],
      '/sessions?_action=validate',
      'POST',
      undefined,
      'root',
    );

    expect(fetch.mock.calls[0][0]).toBe(
      'https://am.example.com/am/json/realms/root/sessions?_action=validate',
    );
  });
});
