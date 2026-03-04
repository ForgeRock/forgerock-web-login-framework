import { describe, it, expect } from 'vitest';

import { isAuthComplete } from './am-response-schemas';

describe('isAuthComplete', () => {
  it('isAuthComplete_TokenIdPresent_ReturnsTrue', () => {
    expect(isAuthComplete('{"tokenId":"abc"}')).toBe(true);
  });

  it('isAuthComplete_AuthIdAndCallbacks_ReturnsFalse', () => {
    expect(isAuthComplete('{"authId":"jwt","callbacks":[]}')).toBe(false);
  });

  it('isAuthComplete_TokenIdWithAuthId_ReturnsFalse', () => {
    expect(isAuthComplete('{"tokenId":"x","authId":"y"}')).toBe(false);
  });

  it('isAuthComplete_MalformedJson_ReturnsFalse', () => {
    expect(isAuthComplete('not json')).toBe(false);
  });

  it('isAuthComplete_EmptyString_ReturnsFalse', () => {
    expect(isAuthComplete('')).toBe(false);
  });

  it('isAuthComplete_EmptyObject_ReturnsFalse', () => {
    expect(isAuthComplete('{}')).toBe(false);
  });

  it('isAuthComplete_NullBody_ReturnsFalse', () => {
    expect(isAuthComplete('null')).toBe(false);
  });
});
