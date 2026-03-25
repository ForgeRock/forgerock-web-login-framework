import { describe, it, expect, vi } from 'vitest';
import type { FRCallback } from '@forgerock/javascript-sdk';
import { formatCallbackName } from './utility';

describe('formatCallbackName', () => {
  it('converts PascalCase callback type to readable format', () => {
    const mockCallback = { getType: vi.fn(() => 'NameCallback') } as unknown as FRCallback;
    expect(formatCallbackName(mockCallback)).toBe('Name Callback');
  });

  it('handles single-word types', () => {
    const mockCallback = { getType: vi.fn(() => 'Password') } as unknown as FRCallback;
    expect(formatCallbackName(mockCallback)).toBe('Password');
  });
});
