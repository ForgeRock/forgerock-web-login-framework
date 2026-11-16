/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { afterEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => {
  const env = {} as Record<string, string | undefined>;
  // $core/constants throws at import time when these are missing
  env.FR_AM_URL = 'https://am.example.com/am';
  env.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
  env.FR_REALM_PATH = 'alpha';
  return env;
});

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
// $core/constants reads kit's build state on import
vi.mock('$app/environment', () => ({ building: false }));

import { load } from './+layout.server';

const runLoad = async (): Promise<{ thrown?: boolean; status?: number; message?: string }> => {
  try {
    await load({ request: new Request('https://app.test/editor') } as never);
    return {};
  } catch (cause) {
    return {
      thrown: true,
      status: (cause as { status?: number }).status,
      message: (cause as { body?: { message?: string } }).body?.message,
    };
  }
};

afterEach(() => {
  delete process.env.COMPONENT_API_ENABLED;
});

describe('editor layout gate', () => {
  it('rejects an unauthenticated request with 401', async () => {
    process.env.COMPONENT_API_ENABLED = 'true';
    const outcome = await runLoad(); // the fake request carries no AM credential
    expect(outcome.thrown).toBe(true);
    expect(outcome.status).toBe(401);
  });

  it('throws 404 when the Component API is disabled', async () => {
    process.env.COMPONENT_API_ENABLED = 'false';
    const outcome = await runLoad();
    expect(outcome.status).toBe(404);
    expect(outcome.message).toBe('Not found');
  });

  it('throws 503 when enablement cannot be resolved', async () => {
    process.env.COMPONENT_API_ENABLED = 'not-a-boolean';
    const outcome = await runLoad();
    expect(outcome.status).toBe(503);
    expect(outcome.message).toBe('Component API is misconfigured');
  });
});
