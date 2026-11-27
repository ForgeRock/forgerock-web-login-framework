import { Either } from 'effect';
import { describe, expect, it } from 'vitest';

import { parseComponentName, safeNameForTerminal } from '../src/component-name.utilities.js';

describe('parseComponentName', () => {
  const expectIdentifier = (raw: string, expected: string): void => {
    const parsed = parseComponentName(raw);
    expect(Either.isRight(parsed)).toBe(true);
    if (Either.isRight(parsed)) {
      expect(parsed.right).toBe(expected);
    }
  };

  const expectRejected = (raw: string): void => {
    const parsed = parseComponentName(raw);
    expect(Either.isLeft(parsed)).toBe(true);
    if (Either.isLeft(parsed)) {
      expect(parsed.left._tag).toBe('ComponentNameParseError');
    }
  };

  it('keeps already-safe PascalCase names unchanged', () => {
    expectIdentifier('DefaultLogin', 'DefaultLogin');
    expectIdentifier('MyCallback', 'MyCallback');
    expectIdentifier('OAuth2Login', 'OAuth2Login');
  });

  it('PascalCases each alphanumeric run and drops separators', () => {
    expectIdentifier("Bad'Name", 'BadName');
    expectIdentifier('My Login Stage', 'MyLoginStage');
    expectIdentifier('my-cool-stage', 'MyCoolStage');
  });

  it('strips comment-breaking and markup sequences from the identifier', () => {
    expectIdentifier('Foo */ evil()', 'FooEvil');
    expectIdentifier('x --> <script>', 'XScript');
  });

  it('strips leading digits so the identifier starts with a letter', () => {
    expectIdentifier('2FA Login', 'FALogin');
    expectIdentifier('42cool', 'cool');
  });

  it('rejects names that sanitize to an empty identifier with the typed error', () => {
    expectRejected('123');
    expectRejected('!!!');
    expectRejected('');
    expectRejected('../..');
  });

  it('rejects names made only of control characters', () => {
    expectRejected('\x01\x02');
  });

  it('error carries remediation describing a valid name', () => {
    const parsed = parseComponentName('123');
    if (Either.isLeft(parsed)) {
      expect(parsed.left.remediation).toContain('letters and digits');
      expect(parsed.left.remediation).toContain('DefaultLogin');
    } else {
      expect.unreachable('expected a rejection for "123"');
    }
  });
});

describe('safeNameForTerminal', () => {
  it('leaves names without control characters unchanged', () => {
    expect(safeNameForTerminal('My Login Stage')).toBe('My Login Stage');
    expect(safeNameForTerminal("Bad'Name")).toBe("Bad'Name");
  });

  it('escapes control characters as visible unicode escapes', () => {
    expect(safeNameForTerminal('Bad\x01Name')).toBe('Bad\\u0001Name');
    expect(safeNameForTerminal('a\x1b[31mb')).toBe('a\\u001b[31mb');
  });
});
