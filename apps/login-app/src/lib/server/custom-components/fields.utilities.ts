/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Option } from 'effect';

/** Property names that could pollute `Object.prototype` and must never be picked. */
const UNSAFE_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Drops routes that name no property or touch an unsafe name:
 *
 *   fields = [['meta','src'], [], ['__proto__','x']]
 *     → returns [['meta','src']]
 */
const safeRoutes = (fields: ReadonlyArray<ReadonlyArray<string>>) =>
  fields.filter((route) => route.length > 0 && route.every((name) => !UNSAFE_NAMES.has(name)));

/**
 * Reads one route's value off the record, walking only through nested objects:
 *
 *   record = { id:'u1', meta:{ src:'<svelte>' } }, route = ['meta','src']
 *     → returns Some('<svelte>')
 *
 *   record = { id:'u1', json:5 }, route = ['json','preview']
 *     → returns None          (json is a primitive — the walk cannot continue)
 */
const readRoute = (
  record: Record<string, unknown>,
  route: ReadonlyArray<string>,
): Option.Option<unknown> => {
  const [head, ...rest] = route;
  const value = record[head];
  if (rest.length === 0) {
    return value === undefined ? Option.none() : Option.some(value);
  }
  return isRecord(value) ? readRoute(value, rest) : Option.none();
};

/**
 * Copies one route's value into the projection, creating nested holders immutably:
 *
 *   target = { id:'u1' }, route = ['meta','src'], value = '<svelte>'
 *     → returns { id:'u1', meta:{ src:'<svelte>' } }
 */
const writeRoute = (
  target: Record<string, unknown>,
  route: ReadonlyArray<string>,
  value: unknown,
): Record<string, unknown> => {
  const [head, ...rest] = route;
  if (rest.length === 0) {
    return { ...target, [head]: value };
  }
  const child = isRecord(target[head]) ? (target[head] as Record<string, unknown>) : {};
  return { ...target, [head]: writeRoute(child, rest, value) };
};

/**
 * Narrows a record to just the properties listed in `?fields=`. Each route is picked
 * independently: a route missing from the record, or passing through a non-object,
 * is skipped — the other routes still come through:
 *
 *   fields = [['meta','src'], ['id']]
 *   record = { id:'u1', src:'<svelte>', meta:{src:'<svelte>',name:'x'}, junk:9 }
 *     → returns { id:'u1', meta:{ src:'<svelte>' } }
 *
 *   fields = [['json','preview'], ['id']]
 *   record = { id:'u1', json:5 }
 *     → returns { id:'u1' }   (json is a primitive — its route is skipped)
 *
 * @param record - The source component record.
 * @param fields - The `?fields=` routes split into property-name arrays; no routes retains the full record.
 * @returns A new record with only the requested properties.
 */
export const pickFields = (
  record: Record<string, unknown>,
  fields: ReadonlyArray<ReadonlyArray<string>>,
): Record<string, unknown> => {
  if (fields.length === 0) {
    return { ...record };
  }
  return safeRoutes(fields).reduce(
    (picked, route) =>
      Option.match(readRoute(record, route), {
        onNone: () => picked,
        onSome: (value) => writeRoute(picked, route, value),
      }),
    {} as Record<string, unknown>,
  );
};
