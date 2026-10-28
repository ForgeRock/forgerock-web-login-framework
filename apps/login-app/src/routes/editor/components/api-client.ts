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
 * browser (GET/PUT/POST/DELETE), same-origin with the SvelteKit routes. Relative
 * /api base keeps the same code working in any hosting context. DOM-free:
 * operations return results, views decide how to render them.
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

const request = async <T>(
  segments: readonly [string, ...string[]],
  init?: RequestInit,
): Promise<ApiResult<T>> => {
  let response: Response | undefined;
  try {
    response = await fetch(`/api/components/${segments.map(encodeURIComponent).join('/')}`, init);
    if (!response.ok) {
      return { ok: false, status: response.status, message: await response.text() };
    }
    // 204 responses (delete, publish) have no body — don't parse JSON into a throw.
    const text = await response.text();
    return { ok: true, data: (text === '' ? null : JSON.parse(text)) as T };
  } catch (error) {
    // status 0 is the Fetch spec's value for a network error:
    // https://fetch.spec.whatwg.org/#concept-network-error
    return {
      ok: false,
      status: response?.status ?? 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

/** Creates a record; returns the created record with server-owned id and dates. */
export const createRecord = async (
  type: string,
  body: { src: string; meta: Omit<ComponentRecord['meta'], 'createdDate' | 'modifiedDate'> },
): Promise<ApiResult<ComponentRecord>> => {
  return request<ComponentRecord>([type], {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
};

/** Updates the record (server-owned dates are rejected by the API). */
export const updateRecord = async (
  type: string,
  id: string,
  body: { src: string; meta: ComponentRecord['meta'] },
): Promise<ApiResult<ComponentRecord>> => {
  const { createdDate: _created, modifiedDate: _modified, ...clientMeta } = body.meta;
  return request<ComponentRecord>([type, id], {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ src: body.src, meta: clientMeta }),
  });
};

/** Deletes a record. */
export const deleteRecord = async (type: string, id: string): Promise<ApiResult<null>> => {
  return request<null>([type, id], { method: 'DELETE' });
};

/** Publishes one global bundle of component source code. */
export const publishBundle = async (code: string): Promise<ApiResult<null>> => {
  return request<null>(['publish'], {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
};
