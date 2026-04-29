import { describe, expect, it } from 'vitest';
import { Schema } from 'effect';
import { CallbackNameSchema, StageNameSchema } from '../src/commands/generate.js';

const decodeCallback = Schema.decodeSync(CallbackNameSchema);
const decodeStage = Schema.decodeSync(StageNameSchema);

describe('CallbackNameSchema', () => {
  describe('valid names — slug generation', () => {
    it('converts simple PascalCase', () => {
      expect(decodeCallback('MyCallback').slug).toBe('my-callback');
      expect(decodeCallback('DefaultLogin').slug).toBe('default-login');
    });

    it('handles acronyms at the end', () => {
      expect(decodeCallback('MyURL').slug).toBe('my-url');
      expect(decodeCallback('ParseJSON').slug).toBe('parse-json');
    });

    it('handles acronyms at the start', () => {
      expect(decodeCallback('JWTCallback').slug).toBe('jwt-callback');
      expect(decodeCallback('OTPLogin').slug).toBe('otp-login');
    });

    it('handles acronyms in the middle', () => {
      expect(decodeCallback('MyURLCallback').slug).toBe('my-url-callback');
      expect(decodeCallback('ParseJSONResponse').slug).toBe('parse-json-response');
    });

    it('handles single-segment names', () => {
      expect(decodeCallback('Login').slug).toBe('login');
    });

    it('preserves the original PascalCase name', () => {
      expect(decodeCallback('MyCallback').name).toBe('MyCallback');
    });
  });

  describe('invalid names — Java class names only', () => {
    const reject = (name: string) => expect(() => decodeCallback(name)).toThrow();

    it('rejects empty string', () => reject(''));
    it('rejects single character', () => reject('A'));

    it('rejects names starting with lowercase', () => {
      reject('myCallback');
      reject('callback');
    });

    it('rejects names starting with a digit', () => reject('2FA'));

    it('rejects names with spaces or special characters', () => {
      reject('My Callback');
      reject('My-Callback');
      reject('My/Callback');
      reject('My.Callback');
      reject('../evil');
    });
  });
});

describe('StageNameSchema', () => {
  describe('valid names — AM stage names are arbitrary strings', () => {
    it('accepts PascalCase (common AM convention)', () => {
      expect(decodeStage('DefaultLogin').name).toBe('DefaultLogin');
      expect(decodeStage('DefaultLogin').slug).toBe('defaultlogin');
    });

    it('accepts names with spaces', () => {
      expect(decodeStage('My Login Stage').slug).toBe('my-login-stage');
      expect(decodeStage('My Login Stage').name).toBe('My Login Stage');
    });

    it('accepts names with hyphens', () => {
      expect(decodeStage('my-login').slug).toBe('my-login');
    });

    it('accepts names with mixed separators', () => {
      expect(decodeStage('OTP Login').slug).toBe('otp-login');
    });

    it('preserves the original name', () => {
      expect(decodeStage('My Stage').name).toBe('My Stage');
    });
  });

  describe('invalid names — path traversal and empty strings rejected', () => {
    const reject = (name: string) => expect(() => decodeStage(name)).toThrow();

    it('rejects empty string', () => reject(''));
    it('rejects single character with no letters', () => reject('1'));
    it('rejects path traversal', () => {
      reject('../evil');
      reject('..\\evil');
    });
    it('rejects newlines', () => reject('My\nStage'));
    it('rejects null bytes', () => reject('My\x00Stage'));
  });
});
