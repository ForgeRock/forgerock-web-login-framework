/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { expect, test } from '@playwright/test';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { AM_REALM, AM_URL, componentsApiUrl, componentsRepoDir } from '../../playwright.config';
import { password as adminPassword, username as adminUsername } from '../utilities/admin-user.js';
import { password as demoPassword, username as demoUsername } from '../utilities/demo-user.js';

// The shared port-3000 preview server serves the Component API with
// COMPONENT_API_ENABLED=true and COMPONENT_CONFIG_DIR under componentsRepoDir.
const api = componentsApiUrl;

let adminToken: string | undefined;

const jsonRequest = (
  path: string,
  method: string,
  body: unknown,
): Promise<{ status: number; json: () => Promise<unknown> }> =>
  fetch(`${api}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${adminToken}`,
      'content-type': 'application/json',
    },
    body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body),
  });

const meta = {
  name: 'e2e',
  displayName: 'E2E',
  publish: false,
  fromComponent: '',
  fromJson: '',
};

const configDir = join(componentsRepoDir, 'config');

// The app's session reader posts tokenId to AM's sessions validate endpoint with the
// token in both the cookie header and the body, so a bare authenticate tokenId works as a Bearer credential.
const authenticate = async (user: string, pass: string): Promise<string> => {
  if (!user || !pass) {
    throw new Error(
      'Admin credentials are required (CI secrets FR_AM_ADMIN_USERNAME/FR_AM_ADMIN_PASSWORD)',
    );
  }
  const response = await fetch(`${AM_URL}/json/realms/root/realms/${AM_REALM}/authenticate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept-api-version': 'protocol=1.0,resource=2.1',
      'x-openam-username': user,
      'x-openam-password': pass,
    },
  });
  expect(response.status).toBe(200);
  const { tokenId } = (await response.json()) as { tokenId: string };
  return tokenId;
};

test.beforeAll(async () => {
  // These tests authenticate as an AM admin — CI-only (repo secrets).
  test.skip(!process.env.CI, 'Component API tests run only in CI');

  try {
    adminToken = await authenticate(adminUsername, adminPassword);
  } catch {
    throw new Error(
      'AM rejected the Component API admin credentials — check FR_AM_ADMIN_USERNAME/FR_AM_ADMIN_PASSWORD',
    );
  }

  await rm(componentsRepoDir, { recursive: true, force: true });
});

test.afterAll(async () => {
  await rm(componentsRepoDir, { recursive: true, force: true });
});

test.describe('Component API file persistence', () => {
  test('serves the OpenAPI document from the production build while the API is enabled', async () => {
    const response = await fetch(`${componentsApiUrl}/../openapi`);
    expect(response.status).toBe(200);
    const spec = (await response.json()) as { paths: Record<string, unknown> };
    expect(Object.keys(spec.paths)).toContain('/api/components/{type}');
  });

  test('renders Swagger UI on the api-docs page', async ({ page }) => {
    await page.goto('/api-docs');

    await expect(page.getByRole('heading', { name: /Login App Component API/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Authorize' })).toBeVisible();

    for (const section of ['Components', 'Health']) {
      await expect(page.getByRole('heading', { name: section })).toBeVisible();
    }
  });

  test('creates a record file under the tracked subpath with server-owned id and dates', async () => {
    const response = await jsonRequest('/callbacks', 'POST', {
      src: 'e2e source',
      meta,
    });
    expect(response.status).toBe(201);

    const created = (await response.json()) as { id: string; meta: Record<string, unknown> };
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(created.meta.createdDate).toBeTruthy();
    expect(created.meta.modifiedDate).toBeTruthy();

    const recordPath = join(configDir, 'callbacks', `${created.id}.json`);
    const raw = await readFile(recordPath, 'utf8');
    expect(JSON.parse(raw)).toEqual(created);
  });

  test('GET returns the same record that is stored on disk', async () => {
    const created = await jsonRequest('/stages', 'POST', { src: 'stages source', meta });
    const { id } = (await created.json()) as { id: string };

    const response = await jsonRequest(`/stages/${id}`, 'GET');
    expect(response.status).toBe(200);

    const fetched = (await response.json()) as Record<string, unknown>;
    const raw = await readFile(join(configDir, 'stages', `${id}.json`), 'utf8');
    expect(fetched).toEqual(JSON.parse(raw));
  });

  test('update rewrites the file, preserves createdDate, and bumps modifiedDate', async () => {
    const created = await jsonRequest('/headers', 'POST', { src: 'original', meta });
    const { id, meta: createdMeta } = (await created.json()) as {
      id: string;
      meta: { createdDate: string; modifiedDate: string };
    };

    const response = await jsonRequest(`/headers/${id}`, 'PUT', {
      src: 'updated by e2e',
      meta,
    });
    expect(response.status).toBe(200);

    const updated = (await response.json()) as {
      meta: { createdDate: string; modifiedDate: string };
    };
    expect(updated.meta.createdDate).toBe(createdMeta.createdDate);

    const raw = await readFile(join(configDir, 'headers', `${id}.json`), 'utf8');
    expect((JSON.parse(raw) as { src: string }).src).toBe('updated by e2e');
    expect(
      (JSON.parse(raw) as { meta: { modifiedDate: string } }).meta.modifiedDate >=
        createdMeta.modifiedDate,
    ).toBe(true);
  });

  test('delete removes the record file', async () => {
    const created = await jsonRequest('/containers', 'POST', { src: 'doomed', meta });
    const { id } = (await created.json()) as { id: string };

    const response = await jsonRequest(`/containers/${id}`, 'DELETE');
    expect(response.status).toBe(204);
    await expect(readFile(join(configDir, 'containers', `${id}.json`), 'utf8')).rejects.toThrow();
  });

  test('publish writes bundle.js at the repository root', async () => {
    const response = await jsonRequest('/publish', 'POST', {
      code: 'console.log("e2e bundle");',
    });
    expect(response.status).toBe(204);

    const bundle = await readFile(join(configDir, 'bundle.js'), 'utf8');
    expect(bundle).toBe('console.log("e2e bundle");');
  });

  test('list projections exclude unrequested fields', async () => {
    const response = await jsonRequest('/callbacks?fields=id,meta.name', 'GET');
    expect(response.status).toBe(200);

    const records = (await response.json()) as Array<Record<string, unknown>>;
    expect(records.length).toBeGreaterThan(0);
    for (const record of records) {
      expect('id' in record).toBe(true);
      expect('src' in record).toBe(false);
    }
  });

  test('list returns every created record for a type', async () => {
    const created = await Promise.all([
      jsonRequest('/footers', 'POST', { src: 'list one', meta }),
      jsonRequest('/footers', 'POST', { src: 'list two', meta }),
      jsonRequest('/footers', 'POST', { src: 'list three', meta }),
    ]);
    expect(created.map((response) => response.status)).toEqual([201, 201, 201]);
    const ids = await Promise.all(
      created.map(async (response) => ((await response.json()) as { id: string }).id),
    );

    const response = await jsonRequest('/footers', 'GET');
    expect(response.status).toBe(200);

    const records = (await response.json()) as Array<{ id: string }>;
    for (const id of ids) {
      expect(records.some((record) => record.id === id)).toBe(true);
    }

    const onDisk = (await readdir(join(configDir, 'footers'))).filter((entry) =>
      entry.endsWith('.json'),
    );
    expect(onDisk.sort()).toEqual(ids.map((id) => `${id}.json`).sort());
  });

  test('rejects a garbage bearer token with 401 from real AM validation', async () => {
    const response = await fetch(`${api}/callbacks`, {
      headers: { authorization: 'Bearer not-a-real-am-session-token' },
    });
    expect(response.status).toBe(401);

    const body = (await response.json()) as { error: string };
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('rejects a valid non-admin session with 403', async () => {
    const demoToken = await authenticate(demoUsername, demoPassword);
    const response = await fetch(`${api}/callbacks`, {
      headers: { authorization: `Bearer ${demoToken}` },
    });
    expect(response.status).toBe(403);

    const written = await readFile(
      join(configDir, 'callbacks', 'non-admin-write.json'),
      'utf8',
    ).catch(() => null);
    expect(written).toBeNull();
  });

  test('rejects a client-supplied id with 400; a top-level createdDate is ignored', async () => {
    const response = await jsonRequest('/callbacks', 'POST', {
      id: '550e8400-e29b-41d4-a716-446655440000',
      createdDate: '2020-01-01T00:00:00.000Z',
      src: 'hijack attempt',
      meta,
    });
    expect(response.status).toBe(400);

    const listed = await jsonRequest('/callbacks', 'GET');
    const records = (await listed.json()) as Array<{ id: string }>;
    expect(records.some((record) => record.id === '550e8400-e29b-41d4-a716-446655440000')).toBe(
      false,
    );
  });

  test('persists the json payload field verbatim', async () => {
    const payload = { nested: { array: [1, 'two', null] }, flag: true };
    const created = await jsonRequest('/stages', 'POST', {
      src: 'json passthrough',
      json: payload,
      meta,
    });
    expect(created.status).toBe(201);
    const record = (await created.json()) as { id: string; json: unknown };
    expect(record.json).toEqual(payload);

    const raw = await readFile(join(configDir, 'stages', `${record.id}.json`), 'utf8');
    expect((JSON.parse(raw) as { json: unknown }).json).toEqual(payload);

    const fetched = await jsonRequest(`/stages/${record.id}`, 'GET');
    expect(((await fetched.json()) as { json: unknown }).json).toEqual(payload);
  });

  test('list skips a malformed record file without failing', async () => {
    await jsonRequest('/headers', 'POST', { src: 'valid marker', meta });
    const corruptPath = join(configDir, 'headers', 'corrupt-artifact.json');
    await writeFile(corruptPath, '{bad json', 'utf8');

    try {
      const response = await jsonRequest('/headers', 'GET');
      expect(response.status).toBe(200);
      const records = (await response.json()) as Array<{ src?: string }>;
      expect(records.some((record) => record.src === 'valid marker')).toBe(true);
      expect(records.some((record) => (record as Record<string, unknown>).corrupt === true)).toBe(
        false,
      );
    } finally {
      await rm(corruptPath, { force: true });
    }
  });

  test('keeps records isolated to their component type directory', async () => {
    const created = await jsonRequest('/callbacks', 'POST', { src: 'isolation probe', meta });
    const { id } = (await created.json()) as { id: string };

    const own = await readFile(join(configDir, 'callbacks', `${id}.json`), 'utf8');
    expect(JSON.parse(own)).toBeTruthy();

    for (const other of ['stages', 'containers', 'headers', 'footers']) {
      const listed = await jsonRequest(`/${other}`, 'GET');
      expect(listed.status).toBe(200);
      const records = (await listed.json()) as Array<{ id: string }>;
      expect(records.some((record) => record.id === id)).toBe(false);

      const exists = await readFile(join(configDir, other, `${id}.json`), 'utf8').catch(() => null);
      expect(exists).toBeNull();
    }
  });

  test('no temporary files are left behind in any type directory', async () => {
    const created = await jsonRequest('/footers', 'POST', { src: 'residue check', meta });
    const { id } = (await created.json()) as { id: string };
    await jsonRequest(`/footers/${id}`, 'DELETE');

    for (const directory of ['callbacks', 'stages', 'headers', 'containers', 'footers']) {
      const entries = await readdir(join(configDir, directory), { recursive: true }).catch(
        () => [],
      );
      expect(entries.filter((entry) => String(entry).includes('.tmp'))).toEqual([]);
    }
  });
});
