/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

/**
 * Component API client — the editor calls the Component API directly from the
 * browser (GET/PUT/POST/DELETE), same-origin in dev via login-app's
 * /custom-components proxy and from the AIC admin UI in production. Relative
 * /api base keeps the same code working in both worlds. DOM-free: operations
 * return results, views decide how to render them.
 */

/** A component record as returned by the Component API. */
export interface ComponentRecord {
  id: string;
  src: string;
  json?: unknown;
  meta: {
    name: string;
    displayName: string;
    publish: boolean;
    fromComponent: string;
    fromJson: string;
    createdDate: string;
    modifiedDate: string;
  };
}

/** A client-friendly failure: status plus the API's error body text. */
export interface ApiFailure {
  ok: false;
  status: number;
  message: string;
}

export type ApiResult<T> = { ok: true; data: T } | ApiFailure;

const request = async <T>(path: string, init?: RequestInit): Promise<ApiResult<T>> => {
  try {
    const response = await fetch(`/api${path}`, init);
    if (!response.ok) {
      return { ok: false, status: response.status, message: await response.text() };
    }
    // 204 responses (delete, publish) have no body — don't parse JSON into a throw.
    const text = await response.text();
    return { ok: true, data: (text === '' ? null : JSON.parse(text)) as T };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

/** Lists all records of one type. A missing records directory (404) is an empty list. */
export const listRecords = async (type: string): Promise<ApiResult<ComponentRecord[]>> => {
  const result = await request<ComponentRecord[]>(`/components/${type}`);
  if (result.ok) {
    return result;
  }
  return result.status === 404 ? { ok: true, data: [] } : result;
};

/** Fetches one record. A 404 becomes a failure with the API's status. */
export const getRecord = async (type: string, id: string): Promise<ApiResult<ComponentRecord>> => {
  return request<ComponentRecord>(`/components/${type}/${id}`);
};

/** Creates a record; returns the created record with server-owned id and dates. */
export const createRecord = async (
  type: string,
  body: { src: string; meta: Omit<ComponentRecord['meta'], 'createdDate' | 'modifiedDate'> },
): Promise<ApiResult<ComponentRecord>> => {
  return request<ComponentRecord>(`/components/${type}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
};

/** Saves the edited record (server-owned dates are rejected by the API). */
export const saveRecord = async (
  type: string,
  id: string,
  body: { src: string; meta: ComponentRecord['meta'] },
): Promise<ApiResult<ComponentRecord>> => {
  const { createdDate: _created, modifiedDate: _modified, ...clientMeta } = body.meta;
  return request<ComponentRecord>(`/components/${type}/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ src: body.src, meta: clientMeta }),
  });
};

/** Deletes a record. */
export const deleteRecord = async (type: string, id: string): Promise<ApiResult<null>> => {
  return request<null>(`/components/${type}/${id}`, { method: 'DELETE' });
};

/** Publishes one global bundle of component source code. */
export const publishBundle = async (code: string): Promise<ApiResult<null>> => {
  return request<null>('/components/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
};
