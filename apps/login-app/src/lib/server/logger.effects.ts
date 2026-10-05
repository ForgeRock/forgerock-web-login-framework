/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { logger } from '@forgerock/sdk-logger';

import type { CustomLogger, LogMessage } from '@forgerock/sdk-logger';

type LogMethod = keyof CustomLogger;

type LogFields = { readonly [field: string]: unknown };

const isFields = (value: LogMessage): value is LogFields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const describeError = (error: Error): LogFields => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
  ...(error.cause === undefined
    ? {}
    : { cause: error.cause instanceof Error ? describeError(error.cause) : String(error.cause) }),
});

const fieldsFrom = (detail: LogMessage): LogFields => {
  if (detail instanceof Error) {
    return { error: describeError(detail) };
  }
  if (isFields(detail)) {
    return detail;
  }
  return { detail };
};

const write =
  (method: LogMethod) =>
  (...args: LogMessage[]): void => {
    const [message, ...details] = args;
    try {
      const fields = details.reduce<LogFields>(
        (merged, detail) => ({ ...merged, ...fieldsFrom(detail) }),
        {},
      );
      console[method](
        JSON.stringify({ time: new Date().toISOString(), level: method, message, ...fields }),
      );
    } catch {
      // A log call must never break the request it describes.
      console[method](String(message));
    }
  };

export const log = logger({
  level: 'info',
  custom: {
    error: write('error'),
    warn: write('warn'),
    info: write('info'),
    debug: write('debug'),
  },
});
