/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'root',
  },
}));

import {
  createComponent,
  deleteComponent,
  getComponent,
  listComponents,
  publishComponentSource,
  updateComponent,
} from './api';
import { createComponentAuth } from './auth';
import { ComponentPublishError, ComponentStoreError } from './component.types';
import { fileSyncNoop } from './file-sync';
import { createComponentPublisher } from './publisher';
import { createComponentStore } from './records';
import { createComponentRepo } from './repo';

import type { ComponentApiDependencies, ComponentLogger } from './component.types';
import type { AmSessionDependencies } from './component.types';

const temporaryDirectories: string[] = [];

process.env.COMPONENT_API_ENABLED = 'true';

/** AM readers accepting every session as an admin, standing in for a valid AM admin session. */
const adminDependencies: AmSessionDependencies = {
  getUserId: () => Promise.resolve('test-admin'),
  getRoles: () => Promise.resolve(['ui-realm-admin']),
};

/** AM readers rejecting every session, standing in for an invalid session. */
const unauthenticatedDependencies: AmSessionDependencies = {
  getUserId: () => Promise.resolve(null),
  getRoles: () => Promise.resolve([]),
};

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'api-'));
  temporaryDirectories.push(directory);
  return directory;
};

const makeDependencies = (
  repoDir: string,
  authDependencies: AmSessionDependencies = adminDependencies,
): ComponentApiDependencies => {
  const config = { repoDir, trackedSubpath: 'config' };
  const repo = createComponentRepo(config, fileSyncNoop);
  const log: ComponentLogger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
  return {
    authenticate: createComponentAuth(authDependencies),
    store: createComponentStore(config, repo, fileSyncNoop, log),
    publish: createComponentPublisher(repo),
    log,
  };
};

const authorizedRequest = (url: string, init?: RequestInit): Request =>
  new Request(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: 'Bearer am-session-token' },
  });

const componentBody = () =>
  JSON.stringify({
    src: 'test source',
    meta: {
      name: 'test',
      displayName: 'Test',
      publish: false,
      fromComponent: '',
      fromJson: '',
    },
  });

afterEach(async () => {
  process.env.COMPONENT_API_ENABLED = 'true';
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('Component Endpoint Handlers', () => {
  describe('listComponents', () => {
    it('returns an empty array when no components exist', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await listComponents(
        authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
        'callbacks',
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    it('returns projected fields when fields query parameter is provided', async () => {
      const repoDir = await makeTemporaryDirectory();

      await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir),
      );

      const request = authorizedRequest(
        'http://localhost/api/components/callbacks?fields=id,meta.name',
        { method: 'GET' },
      );
      const response = await listComponents(request, 'callbacks', makeDependencies(repoDir));

      expect(response.status).toBe(200);
      const body = (await response.json()) as Array<Record<string, unknown>>;
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        const record = body[0];
        expect('id' in record).toBe(true);
        expect('meta' in record).toBe(true);
        const meta = record.meta as Record<string, unknown>;
        expect('name' in meta).toBe(true);
        expect('src' in record).toBe(false);
      }
    });

    it('returns 400 for invalid fields parameter', async () => {
      const repoDir = await makeTemporaryDirectory();
      const request = authorizedRequest(
        'http://localhost/api/components/callbacks?fields=..invalid',
        {
          method: 'GET',
        },
      );
      const response = await listComponents(request, 'callbacks', makeDependencies(repoDir));
      expect(response.status).toBe(400);
    });

    it('returns 404 for invalid component type', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await listComponents(
        authorizedRequest('http://localhost/api/components/invalid-type', { method: 'GET' }),
        'invalid-type',
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(404);
    });
  });

  describe('getComponent', () => {
    it('returns a component by id', async () => {
      const repoDir = await makeTemporaryDirectory();

      const createResponse = await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir),
      );

      const createData = (await createResponse.json()) as { id: string };
      const id = createData.id;

      const getResponse = await getComponent(
        authorizedRequest(`http://localhost/api/components/callbacks/${id}`, {
          method: 'GET',
        }),
        'callbacks',
        id,
        makeDependencies(repoDir),
      );
      expect(getResponse.status).toBe(200);
    });

    it('returns 404 for missing component', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await getComponent(
        authorizedRequest(
          'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          { method: 'GET' },
        ),
        'callbacks',
        'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(404);
    });
  });

  describe('createComponent', () => {
    it('creates a component and returns 201', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(201);
    });

    it('returns 401 when the session is not authenticated', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir, unauthenticatedDependencies),
      );
      expect(response.status).toBe(401);
    });

    it('returns 401 without an authorization header', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await createComponent(
        new Request('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir, unauthenticatedDependencies),
      );
      expect(response.status).toBe(401);
    });

    it('returns 403 for an authenticated non-admin session', async () => {
      const repoDir = await makeTemporaryDirectory();
      const nonAdminDependencies: AmSessionDependencies = {
        getUserId: () => Promise.resolve('regular-user'),
        getRoles: () => Promise.resolve(['ui-enduser']),
      };
      const response = await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir, nonAdminDependencies),
      );
      expect(response.status).toBe(403);
    });

    it('returns 404 for every handler when the API is disabled', async () => {
      delete process.env.COMPONENT_API_ENABLED;
      try {
        const repoDir = await makeTemporaryDirectory();
        const list = await listComponents(
          authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
          'callbacks',
          makeDependencies(repoDir),
        );
        const create = await createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
          makeDependencies(repoDir),
        );
        expect(list.status).toBe(404);
        expect(create.status).toBe(404);
      } finally {
        process.env.COMPONENT_API_ENABLED = 'true';
      }
    });

    it('returns 415 for invalid content-type', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          body: 'test',
        }),
        'callbacks',
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(415);
    });
  });

  describe('updateComponent', () => {
    it('updates a component and returns 200', async () => {
      const repoDir = await makeTemporaryDirectory();

      const createResponse = await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir),
      );

      const createData = (await createResponse.json()) as {
        id: string;
        meta: { createdDate: string; modifiedDate: string };
      };

      const updateResponse = await updateComponent(
        authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: componentBody().replace('test source', 'updated source'),
        }),
        'callbacks',
        createData.id,
        makeDependencies(repoDir),
      );

      expect(updateResponse.status).toBe(200);

      const updateData = (await updateResponse.json()) as {
        meta: { createdDate: string; modifiedDate: string };
      };
      expect(updateData.meta.createdDate).toBe(createData.meta.createdDate);
      expect(updateData.meta.modifiedDate >= createData.meta.modifiedDate).toBe(true);
    });

    it('returns 400 when body id does not match URL id', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await updateComponent(
        authorizedRequest('http://localhost/api/components/callbacks/different-uuid', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
            src: 'updated source',
            meta: {
              name: 'test',
              displayName: 'Test',
              publish: false,
              fromComponent: '',
              fromJson: '',
            },
          }),
        }),
        'callbacks',
        'different-uuid',
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(400);
    });
  });

  describe('deleteComponent', () => {
    it('deletes a component and returns 204', async () => {
      const repoDir = await makeTemporaryDirectory();

      const createResponse = await createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        makeDependencies(repoDir),
      );

      const createData = (await createResponse.json()) as { id: string };

      const deleteResponse = await deleteComponent(
        authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
          method: 'DELETE',
        }),
        'callbacks',
        createData.id,
        makeDependencies(repoDir),
      );
      expect(deleteResponse.status).toBe(204);
    });

    it('returns 404 for missing component', async () => {
      const repoDir = await makeTemporaryDirectory();
      const response = await deleteComponent(
        authorizedRequest(
          'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          { method: 'DELETE' },
        ),
        'callbacks',
        'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(404);
    });
  });

  describe('publishComponentSource', () => {
    it('publishes a component bundle and returns 200', async () => {
      const repoDir = await makeTemporaryDirectory();

      const response = await publishComponentSource(
        authorizedRequest('http://localhost/api/components/publish', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            code: 'bundle code',
            files: [{ path: 'test.js', content: 'test' }],
          }),
        }),
        makeDependencies(repoDir),
      );
      expect(response.status).toBe(200);
      const result = (await response.json()) as { id: string; url: string };
      expect(result).toHaveProperty('id');
      expect(result.url).toBe('');
    });

    it('returns 500 when persisting the bundle fails', async () => {
      const dependencies = makeDependencies(await makeTemporaryDirectory());
      const response = await publishComponentSource(
        authorizedRequest('http://localhost/api/components/publish', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: 'bundle code' }),
        }),
        {
          ...dependencies,
          publish: () =>
            Effect.fail(
              new ComponentPublishError({
                reason: 'Storage',
                message: 'Unable to persist component bundle',
              }),
            ),
        },
      );
      expect(response.status).toBe(500);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe('Unable to persist component bundle');
    });

    it('returns 400 for an invalid bundle payload', async () => {
      const response = await publishComponentSource(
        authorizedRequest('http://localhost/api/components/publish', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: 'not json',
        }),
        makeDependencies(await makeTemporaryDirectory()),
      );
      expect(response.status).toBe(400);
    });
  });
});

describe('Component API logging', () => {
  const missingId = 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0';

  const nonAdminDependencies: AmSessionDependencies = {
    getUserId: () => Promise.resolve('regular-user'),
    getRoles: () => Promise.resolve(['ui-enduser']),
  };

  const makeLoggedDependencies = async (authDependencies?: AmSessionDependencies) =>
    makeDependencies(await makeTemporaryDirectory(), authDependencies);

  const createRequest = (): Request =>
    authorizedRequest('http://localhost/api/components/callbacks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: componentBody(),
    });

  const listRequest = (): Request =>
    authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' });

  const publishRequest = (body: unknown): Request =>
    authorizedRequest('http://localhost/api/components/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('audits a created component with the caller, type, id and name', async () => {
    const dependencies = await makeLoggedDependencies();

    const response = await createComponent(createRequest(), 'callbacks', dependencies);
    const { id } = (await response.json()) as { id: string };

    expect(dependencies.log.info).toHaveBeenCalledTimes(1);
    expect(dependencies.log.info).toHaveBeenCalledWith('[components] audit', {
      action: 'create',
      outcome: 'succeeded',
      uid: 'test-admin',
      type: 'callbacks',
      id,
      name: 'test',
    });
  });

  it('audits an update and a delete with the route id', async () => {
    const dependencies = await makeLoggedDependencies();
    const created = await createComponent(createRequest(), 'callbacks', dependencies);
    const { id } = (await created.json()) as { id: string };
    const url = `http://localhost/api/components/callbacks/${id}`;

    await updateComponent(
      authorizedRequest(url, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: componentBody(),
      }),
      'callbacks',
      id,
      dependencies,
    );
    expect(dependencies.log.info).toHaveBeenLastCalledWith('[components] audit', {
      action: 'update',
      outcome: 'succeeded',
      uid: 'test-admin',
      type: 'callbacks',
      id,
      name: 'test',
    });

    await deleteComponent(
      authorizedRequest(url, { method: 'DELETE' }),
      'callbacks',
      id,
      dependencies,
    );
    expect(dependencies.log.info).toHaveBeenLastCalledWith('[components] audit', {
      action: 'delete',
      outcome: 'succeeded',
      uid: 'test-admin',
      type: 'callbacks',
      id,
    });
  });

  it('logs nothing for reads, missing records, or client validation errors', async () => {
    const dependencies = await makeLoggedDependencies();
    const url = `http://localhost/api/components/callbacks/${missingId}`;

    await listComponents(listRequest(), 'callbacks', dependencies);
    await getComponent(
      authorizedRequest(url, { method: 'GET' }),
      'callbacks',
      missingId,
      dependencies,
    );
    await updateComponent(
      authorizedRequest(url, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: componentBody(),
      }),
      'callbacks',
      missingId,
      dependencies,
    );
    await deleteComponent(
      authorizedRequest(url, { method: 'DELETE' }),
      'callbacks',
      missingId,
      dependencies,
    );
    await createComponent(
      authorizedRequest('http://localhost/api/components/callbacks', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'test',
      }),
      'callbacks',
      dependencies,
    );

    expect(dependencies.log.info).not.toHaveBeenCalled();
    expect(dependencies.log.warn).not.toHaveBeenCalled();
    expect(dependencies.log.error).not.toHaveBeenCalled();
  });

  it('logs a failed mutation as an error with the cause and no success line', async () => {
    const base = await makeLoggedDependencies();
    const cause = new Error('disk full');
    const dependencies: ComponentApiDependencies = {
      ...base,
      store: {
        ...base.store,
        create: () =>
          Effect.fail(
            new ComponentStoreError({
              reason: 'Storage',
              message: 'Unable to save component record',
              cause,
            }),
          ),
      },
    };

    const response = await createComponent(createRequest(), 'callbacks', dependencies);

    expect(response.status).toBe(500);
    expect(dependencies.log.error).toHaveBeenCalledWith(
      '[components] audit',
      {
        action: 'create',
        outcome: 'failed',
        uid: 'test-admin',
        type: 'callbacks',
        detail: 'Unable to save component record',
      },
      cause,
    );
    expect(dependencies.log.info).not.toHaveBeenCalled();
  });

  it('audits a publish with the files it wrote', async () => {
    const dependencies = await makeLoggedDependencies();

    await publishComponentSource(
      publishRequest({ code: 'bundle code', files: [{ path: 'extra/a.js', content: 'a' }] }),
      dependencies,
    );

    expect(dependencies.log.info).toHaveBeenCalledWith('[components] audit', {
      action: 'publish',
      outcome: 'succeeded',
      uid: 'test-admin',
      paths: ['extra/a.js', 'bundle.js'],
    });
  });

  it('logs a rejected publish as a warning without echoing the unsafe path', async () => {
    const dependencies = await makeLoggedDependencies();

    const response = await publishComponentSource(
      publishRequest({ code: 'x', files: [{ path: '../escape.js', content: 'x' }] }),
      dependencies,
    );

    expect(response.status).toBe(400);
    expect(dependencies.log.warn).toHaveBeenCalledWith('[components] audit', {
      action: 'publish',
      outcome: 'rejected',
      uid: 'test-admin',
      detail: 'Bundle file at index 0 has an unsafe path',
    });
  });

  it('logs a failed publish as an error with the paths and the cause', async () => {
    const base = await makeLoggedDependencies();
    const cause = new Error('disk full');
    const dependencies: ComponentApiDependencies = {
      ...base,
      publish: () =>
        Effect.fail(
          new ComponentPublishError({
            reason: 'Storage',
            message: 'Unable to persist component bundle',
            cause,
          }),
        ),
    };

    const response = await publishComponentSource(
      publishRequest({ code: 'bundle code' }),
      dependencies,
    );

    expect(response.status).toBe(500);
    expect(dependencies.log.error).toHaveBeenCalledWith(
      '[components] audit',
      {
        action: 'publish',
        outcome: 'failed',
        uid: 'test-admin',
        paths: ['bundle.js'],
        detail: 'Unable to persist component bundle',
      },
      cause,
    );
  });

  it('logs a request refused for a known caller, with the reason and uid', async () => {
    const dependencies = await makeLoggedDependencies(nonAdminDependencies);

    await listComponents(listRequest(), 'callbacks', dependencies);

    expect(dependencies.log.warn).toHaveBeenCalledWith('[components] audit', {
      action: 'access',
      outcome: 'denied',
      reason: 'Forbidden',
      detail: 'An AM admin role is required',
      method: 'GET',
      path: '/api/components/callbacks',
      uid: 'regular-user',
    });
  });

  it('does not log a request without a valid session', async () => {
    const dependencies = await makeLoggedDependencies(unauthenticatedDependencies);

    const response = await listComponents(listRequest(), 'callbacks', dependencies);

    expect(response.status).toBe(401);
    expect(dependencies.log.warn).not.toHaveBeenCalled();
    expect(dependencies.log.error).not.toHaveBeenCalled();
  });

  it('logs an AM failure as an error with the cause', async () => {
    const cause = new Error('AM down');
    const dependencies = await makeLoggedDependencies({
      getUserId: () => Promise.reject(cause),
      getRoles: () => Promise.resolve([]),
    });

    const response = await listComponents(listRequest(), 'callbacks', dependencies);

    expect(response.status).toBe(500);
    expect(dependencies.log.error).toHaveBeenCalledWith(
      '[components] audit',
      expect.objectContaining({ outcome: 'failed', reason: 'Unavailable' }),
      cause,
    );
  });

  it('logs nothing while the API is disabled', async () => {
    delete process.env.COMPONENT_API_ENABLED;
    try {
      const dependencies = await makeLoggedDependencies(unauthenticatedDependencies);
      await listComponents(listRequest(), 'callbacks', dependencies);
      expect(dependencies.log.warn).not.toHaveBeenCalled();
    } finally {
      process.env.COMPONENT_API_ENABLED = 'true';
    }
  });
});
