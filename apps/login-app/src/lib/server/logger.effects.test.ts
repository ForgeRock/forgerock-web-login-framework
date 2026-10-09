/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

import { log } from './logger.effects';

import type { MockInstance } from 'vitest';

type ParsedLine = { readonly [field: string]: unknown };

const spyOnConsole = () => ({
  error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
  info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
  debug: vi.spyOn(console, 'debug').mockImplementation(() => undefined),
});

const parseLine = (spy: MockInstance): ParsedLine => JSON.parse(String(spy.mock.calls[0][0]));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('server logger', () => {
  it('writes one JSON line with time, level, message and fields', () => {
    const consoleSpies = spyOnConsole();

    log.info('[test] created', { type: 'callbacks', id: 'abc' });

    expect(consoleSpies.info).toHaveBeenCalledTimes(1);
    expect(parseLine(consoleSpies.info)).toEqual({
      time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      level: 'info',
      message: '[test] created',
      type: 'callbacks',
      id: 'abc',
    });
  });

  it('writes through the console method that matches the level', () => {
    const consoleSpies = spyOnConsole();

    log.error('[test] e');
    log.warn('[test] w');
    log.info('[test] i');

    expect(parseLine(consoleSpies.error)).toMatchObject({ level: 'error', message: '[test] e' });
    expect(parseLine(consoleSpies.warn)).toMatchObject({ level: 'warn', message: '[test] w' });
    expect(parseLine(consoleSpies.info)).toMatchObject({ level: 'info', message: '[test] i' });
  });

  it('does not write debug lines', () => {
    const consoleSpies = spyOnConsole();

    log.debug('[test] hidden');

    expect(consoleSpies.debug).not.toHaveBeenCalled();
  });

  it('folds an Error and its cause into the same single line', () => {
    const consoleSpies = spyOnConsole();

    log.error(
      '[test] failed',
      { type: 'callbacks' },
      new Error('boom', { cause: new Error('disk') }),
    );

    expect(consoleSpies.error).toHaveBeenCalledTimes(1);
    expect(String(consoleSpies.error.mock.calls[0][0])).not.toContain('\n');
    expect(parseLine(consoleSpies.error)).toMatchObject({
      type: 'callbacks',
      error: {
        name: 'Error',
        message: 'boom',
        stack: expect.any(String),
        cause: { message: 'disk' },
      },
    });
  });

  it('never throws when a field cannot be serialized', () => {
    const consoleSpies = spyOnConsole();
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(() => log.info('[test] circular', circular)).not.toThrow();
    expect(consoleSpies.info).toHaveBeenCalledWith('[test] circular');
  });
});
