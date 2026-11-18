/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { request as httpsRequest } from 'node:https';
import type { RequestOptions } from 'node:https';

vi.mock('$app/environment', () => ({ building: false }));
const mockEnv = vi.hoisted(
  () =>
    ({
      FR_AM_URL: 'https://am.example.com/am',
      FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
      FR_REALM_PATH: 'alpha',
    }) as Record<string, string | undefined>,
);
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

const httpsRequestMock = vi.hoisted(() => vi.fn());
vi.mock('node:https', () => ({ request: httpsRequestMock }));

import {
  amFetchRequest,
  fetchAm,
  fetchServerInfoRealm,
  getAmCookie,
  resolveJsonRealmPath,
  resolveOAuthRealmPath,
  setAmCookie,
  upstreamFailureResponse,
} from './sessions';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetAllMocks();
  delete mockEnv.PREVIEW_ALIAS_HOST;
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
  function headersWith(setCookies: string[]): Headers {
    const headers = new Headers();
    for (const cookie of setCookies) headers.append('set-cookie', cookie);
    return headers;
  }

  it('forwards only the configured AM cookie', () => {
    expect(getAmCookie(cookies({ iPlanetDirectoryPro: 'session-token', other: 'ignored' }))).toBe(
      'iPlanetDirectoryPro=session-token',
    );
  });

  it('stores an upstream AM cookie without its upstream domain', () => {
    const target = cookies();

    setAmCookie(
      target,
      headersWith([
        'iPlanetDirectoryPro=session-token; Path=/; Domain=am.example.com; Secure; HttpOnly',
      ]),
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

    setAmCookie(target, headersWith(['iPlanetDirectoryPro=; Path=/; Max-Age=0']));

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
      headersWith([
        'iPlanetDirectoryPro=session-token; Path=/; Max-Age=1800; Domain=am.example.com; Secure; HttpOnly',
      ]),
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
      headersWith([
        'iPlanetDirectoryPro=session-token; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Secure; HttpOnly',
      ]),
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
      headersWith([
        'iPlanetDirectoryPro=session-token; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Max-Age=1800',
      ]),
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
      headersWith([
        'iPlanetDirectoryPro=session-token; Path=/; Max-Age=abc; Expires=not-a-date; Secure; HttpOnly',
      ]),
    );

    expect(target.set.mock.calls[0]).toEqual([
      'iPlanetDirectoryPro',
      'session-token',
      { httpOnly: true, sameSite: 'lax', secure: true, path: '/' },
    ]);
  });

  it('reads the AM cookie out of separate Set-Cookie headers with Expires dates', () => {
    const target = cookies();

    setAmCookie(
      target,
      headersWith([
        'other=abc; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
        'iPlanetDirectoryPro=session-token; Path=/; Expires=Thu, 22 Oct 2026 07:28:00 GMT',
      ]),
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

  it('ignores upstream headers without the AM cookie', () => {
    const target = cookies();

    setAmCookie(target, headersWith(['other=abc; Path=/']));

    expect(target.set).not.toHaveBeenCalled();
    expect(target.delete).not.toHaveBeenCalled();
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
    expect(resolveJsonRealmPath('../../global-config')).toBe('/json/realms/root');
    expect(resolveJsonRealmPath('alpha/../bravo')).toBe('/json/realms/root');
  });
});

describe('fetchServerInfoRealm', () => {
  interface CapturedRequest {
    options: RequestOptions;
    respond: (response: { statusCode: number; body: string }) => void;
    fail: (error: Error) => void;
  }

  // Shapes each httpsRequestMock call after node's API: the callback receives
  // the response stream (async-iterable, like a real IncomingMessage), and
  // request.on() registers event listeners. respond() resolves the promise
  // with that stream; fail() emits 'error'.
  const captureRequests = (): CapturedRequest[] => {
    const requests: CapturedRequest[] = [];
    const implementation = (options: RequestOptions, callback?: (response: unknown) => void) => {
      const handlers: Record<string, ((arg: never) => void)[]> = {};
      const request = {
        on: (event: string, listener: (arg: never) => void) => {
          (handlers[event] ??= []).push(listener);
          return request;
        },
        end: () => {},
        destroy: (error?: Error) => {
          if (error) {
            for (const listener of handlers['error'] ?? []) listener(error as never);
          }
        },
      };
      const stream = (response: { statusCode: number; body: string }) => ({
        statusCode: response.statusCode,
        on: (event: string, listener: (chunk?: string) => void) => {
          if (event === 'data') listener(response.body);
          if (event === 'end') listener();
          return stream(response);
        },
        async *[Symbol.asyncIterator]() {
          yield response.body;
        },
      });
      requests.push({
        options,
        respond: (response) => callback?.(stream(response)),
        fail: (error) => {
          for (const listener of handlers['error'] ?? []) listener(error as never);
        },
      });
      return request;
    };
    httpsRequestMock.mockImplementation(implementation as unknown as typeof httpsRequest);
    return requests;
  };

  it('connects only to the AM origin — the arrival host is a header, never a destination', async () => {
    const requests = captureRequests();

    const pending = fetchServerInfoRealm('https://am-header.example.com/am', 'id.petrov.ca');
    requests[0].respond({ statusCode: 200, body: JSON.stringify({ realm: '/alpha' }) });

    expect(requests[0].options.hostname).toBe('am-header.example.com');
    expect(requests[0].options.servername).toBe('am-header.example.com');
    expect(requests[0].options.path).toBe('/am/json/serverinfo/*');
    expect(requests[0].options.headers).toMatchObject({
      accept: 'application/json',
      host: 'id.petrov.ca',
    });
    await expect(pending).resolves.toBe('alpha');
  });

  it('caches a successful answer by amUrl + effective Host header', async () => {
    const requests = captureRequests();

    const first = fetchServerInfoRealm('https://am-cache.example.com/am', 'id.petrov.ca');
    requests[0].respond({ statusCode: 200, body: JSON.stringify({ realm: '/alpha' }) });
    await expect(first).resolves.toBe('alpha');

    const second = await fetchServerInfoRealm('https://am-cache.example.com/am', 'id.petrov.ca');

    expect(second).toBe('alpha');
    expect(requests).toHaveLength(1); // second call served from cache, no network
  });

  it('does not cache null, so a rejected host is re-asked on the next call', async () => {
    const requests = captureRequests();

    const rejected = fetchServerInfoRealm('https://am-reject.example.com/am', 'id.petrov.ca');
    requests[0].respond({ statusCode: 400, body: 'FQDN not valid' });
    await expect(rejected).resolves.toBeNull();

    const retry = fetchServerInfoRealm('https://am-reject.example.com/am', 'id.petrov.ca');
    requests[1].respond({ statusCode: 200, body: JSON.stringify({ realm: '/alpha' }) });

    await expect(retry).resolves.toBe('alpha'); // went back to AM, not the failed lookup
    expect(requests).toHaveLength(2);
  });

  it('returns null when the AM edge rejects the host (unregistered FQDN)', async () => {
    const requests = captureRequests();

    const pending = fetchServerInfoRealm('https://am.example.com/am', 'attacker.example');
    requests[0].respond({
      statusCode: 400,
      body: JSON.stringify({ code: 400, message: 'FQDN "attacker.example" is not valid.' }),
    });

    await expect(pending).resolves.toBeNull();
  });

  it.each([
    ['a non-JSON body', 200, '<html>404</html>'],
    ['a JSON body without a realm', 200, '{"_id":"*"}'],
    ['a non-200 status', 503, 'unavailable'],
  ])('returns null on %s', async (_label, statusCode, body) => {
    const requests = captureRequests();

    const pending = fetchServerInfoRealm(
      `https://am-null-${statusCode}-${_label.length}.example.com/am`,
      'tenant.example.com',
    );
    requests[0].respond({ statusCode, body });

    await expect(pending).resolves.toBeNull();
  });

  it('returns null on a transport error and never rejects', async () => {
    const requests = captureRequests();

    const pending = fetchServerInfoRealm('https://am.example.com/am', 'tenant.example.com');
    requests[0].fail(new Error('ECONNRESET'));

    await expect(pending).resolves.toBeNull();
  });

  it('returns null (never throws) for a malformed amUrl', async () => {
    await expect(fetchServerInfoRealm('not-a-url', 'tenant.example.com')).resolves.toBeNull();
  });

  it('substitutes PREVIEW_ALIAS_HOST for the arrival host in preview', async () => {
    mockEnv.PREVIEW_ALIAS_HOST = 'id.petrov.ca';
    const requests = captureRequests();

    const pending = fetchServerInfoRealm('https://am-preview.example.com/am', 'localhost');
    requests[0].respond({ statusCode: 200, body: JSON.stringify({ realm: '/alpha' }) });

    await expect(pending).resolves.toBe('alpha');
    expect(requests[0].options.headers).toMatchObject({ host: 'id.petrov.ca' });
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
