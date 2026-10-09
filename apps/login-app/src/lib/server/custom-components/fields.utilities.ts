/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Option } from 'effect';

export * from './api.schemas';

/** Path segments that could pollute `Object.prototype` and are never projected. */
const UNSAFE_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

/** Reads the value at a path of segments, or none when any hop is missing or unsafe. */
const valueAtPath = (source: unknown, segments: ReadonlyArray<string>): Option.Option<unknown> => {
  if (segments.length === 0 || UNSAFE_SEGMENTS.has(segments[0])) {
    return Option.none();
  }
  return segments.reduce<Option.Option<unknown>>(
    (value, segment) =>
      Option.flatMap(value, (step) =>
        typeof step === 'object' &&
        step !== null &&
        !Array.isArray(step) &&
        Object.hasOwn(step, segment)
          ? Option.some((step as Record<string, unknown>)[segment])
          : Option.none(),
      ),
    Option.some(source),
  );
};

/** Returns the object at the parent of a path, creating intermediate objects as needed. */
const containerAtPath = (
  tree: Record<string, unknown>,
  segments: ReadonlyArray<string>,
): Option.Option<Record<string, unknown>> => {
  const parent = segments.slice(0, -1);
  return parent.reduce<Option.Option<Record<string, unknown>>>(
    (container, segment) =>
      Option.flatMap(container, (step) => {
        if (UNSAFE_SEGMENTS.has(segment)) {
          return Option.none();
        }
        if (
          typeof step[segment] !== 'object' ||
          step[segment] === null ||
          Array.isArray(step[segment])
        ) {
          step[segment] = {};
        }
        return Option.some(step[segment] as Record<string, unknown>);
      }),
    Option.some(tree),
  );
};

/**
 * Returns a record containing only requested top-level or nested property paths.
 * Built on a null-prototype object with own-property checks so that paths like
 * `__proto__.toString.x` cannot pollute `Object.prototype`.
 *
 * @param record - The source component record.
 * @param fields - Parsed projection paths; no paths retains the full record.
 * @returns A new, projected record.
 */
export const projectRecord = (
  record: Record<string, unknown>,
  fields: ReadonlyArray<ReadonlyArray<string>>,
): Record<string, unknown> => {
  if (fields.length === 0) {
    return { ...record };
  }

  return fields.reduce<Record<string, unknown>>((projected, segments) => {
    const leaf = segments.at(-1);
    if (leaf === undefined) {
      return projected;
    }
    return Option.match(containerAtPath(projected, segments), {
      onNone: () => projected,
      onSome: (container) =>
        Option.match(valueAtPath(record, segments), {
          onNone: () => container,
          onSome: (value) => {
            container[leaf] = value;
            return projected;
          },
        }),
    });
  }, Object.create(null));
};
