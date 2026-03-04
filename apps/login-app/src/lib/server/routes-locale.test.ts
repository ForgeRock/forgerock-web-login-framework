/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * GET /api/locale — route handler tests
 *
 * Verifies that the locale route reads Accept-Language and returns
 * locale content as JSON.
 *
 * We mock `loadLocaleContent` because it imports from `$core/` which requires
 * path aliases not available in the server-only vitest config.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

import { createApiEvent, setupRouteTestRuntime } from '$server/route-test-helpers';

const mockLoadLocaleContent = vi.fn();

vi.mock('$server/locale', () => ({
  loadLocaleContent: (...args: unknown[]) => mockLoadLocaleContent(...args),
}));

describe('GET /api/locale', () => {
  const { runtime } = setupRouteTestRuntime();
  let GET: typeof import('$routes/api/locale/+server').GET;

  beforeAll(async () => {
    const mod = await import('$routes/api/locale/+server');
    GET = mod.GET;
  });

  afterAll(async () => {
    await runtime.dispose();
  });

  it('GET_EnglishLocale_ReturnsContent', async () => {
    const content = { signIn: 'Sign In', signOut: 'Sign Out' };
    mockLoadLocaleContent.mockReturnValueOnce(Effect.succeed(content));

    const event = createApiEvent({
      method: 'GET',
      url: 'http://localhost:5173/api/locale',
      headers: { 'accept-language': 'en-US' },
    });

    const response = await GET(event as never);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual(content);
    expect(mockLoadLocaleContent).toHaveBeenCalledWith('en-US');
  });

  it('GET_NoHeader_FallsBackToEnUs', async () => {
    const content = { signIn: 'Sign In' };
    mockLoadLocaleContent.mockReturnValueOnce(Effect.succeed(content));

    const event = createApiEvent({
      method: 'GET',
      url: 'http://localhost:5173/api/locale',
    });

    const response = await GET(event as never);
    expect(response.status).toBe(200);
    // Route defaults to 'en-US' when Accept-Language is missing
    expect(mockLoadLocaleContent).toHaveBeenCalledWith('en-US');
  });

  it('GET_UnsupportedLocale_PassesHeaderToLoader', async () => {
    const content = { signIn: 'Sign In' };
    mockLoadLocaleContent.mockReturnValueOnce(Effect.succeed(content));

    const event = createApiEvent({
      method: 'GET',
      url: 'http://localhost:5173/api/locale',
      headers: { 'accept-language': 'xx-XX' },
    });

    const response = await GET(event as never);
    expect(response.status).toBe(200);
    // The route passes whatever Accept-Language it receives to loadLocaleContent
    expect(mockLoadLocaleContent).toHaveBeenCalledWith('xx-XX');
  });
});
