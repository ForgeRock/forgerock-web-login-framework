import { describe, it, expect, vi } from 'vitest';
import type { FRStep } from '@forgerock/javascript-sdk';
import { formatStageName } from './utility';

describe('formatStageName', () => {
  it('converts stage name to readable format', () => {
    const mockStep = { getStage: vi.fn(() => 'DefaultLogin') } as unknown as FRStep;
    expect(formatStageName(mockStep)).toBe('Default Login');
  });

  it('handles missing stage name', () => {
    const mockStep = { getStage: vi.fn(() => '') } as unknown as FRStep;
    expect(formatStageName(mockStep)).toBe('Unknown');
  });
});
