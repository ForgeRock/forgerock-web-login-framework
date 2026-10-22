// IAM-12011 finding T6 — the preview's `journey` prop must satisfy the real
// StageJourneyObject contract (core/journey/journey.interfaces.ts), so a
// component that calls journey.push/pop/redirect/restart or reads
// journey.stack behaves in the preview the way it does in production.
import { get } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';

import { customComponents } from './components';
import { createDemoJourney } from './demo-journey';

const CONTRACT_MEMBERS = ['loading', 'pop', 'push', 'redirect', 'restart', 'stack'];

describe('createDemoJourney (IAM-12011 T6)', () => {
  it('exposes every StageJourneyObject member', () => {
    const journey = createDemoJourney();

    expect(Object.keys(journey).sort()).toEqual(CONTRACT_MEMBERS);
    expect(typeof journey.loading).toBe('boolean');
    expect(typeof journey.pop).toBe('function');
    expect(typeof journey.push).toBe('function');
    expect(typeof journey.redirect).toBe('function');
    expect(typeof journey.restart).toBe('function');
    expect(typeof journey.stack.subscribe).toBe('function');
    expect(typeof journey.stack.latest).toBe('function');
    expect(typeof journey.stack.pop).toBe('function');
    expect(typeof journey.stack.push).toBe('function');
    expect(typeof journey.stack.reset).toBe('function');
  });

  it('defaults loading to false and accepts an override', () => {
    expect(createDemoJourney().loading).toBe(false);
    expect(createDemoJourney({ loading: true }).loading).toBe(true);
  });

  it('push records the request on the stack and logs it', () => {
    const log = vi.fn();
    const journey = createDemoJourney({ log });

    journey.push({ journey: 'ResetPassword' });

    expect(get(journey.stack)).toEqual([{ journey: 'ResetPassword' }]);
    expect(log).toHaveBeenCalledWith('journey.push', { journey: 'ResetPassword' });
  });

  it('pop removes the latest stack entry and logs it', async () => {
    const log = vi.fn();
    const journey = createDemoJourney({ log });
    journey.push({ journey: 'Login' });
    journey.push({ journey: 'Registration' });

    journey.pop();

    expect(get(journey.stack)).toEqual([{ journey: 'Login' }]);
    await expect(journey.stack.latest()).resolves.toEqual({ journey: 'Login' });
    expect(log).toHaveBeenCalledWith('journey.pop');
  });

  it('restart and redirect resolve and log instead of throwing', async () => {
    const log = vi.fn();
    const journey = createDemoJourney({ log });
    const step = { type: 'Step' } as unknown as Parameters<typeof journey.redirect>[0];

    await expect(journey.restart()).resolves.toBeUndefined();
    await expect(journey.redirect(step)).resolves.toBeUndefined();

    expect(log).toHaveBeenCalledWith('journey.restart');
    expect(log).toHaveBeenCalledWith('journey.redirect', step);
  });

  it('gives each call its own stack', () => {
    const first = createDemoJourney();
    const second = createDemoJourney();

    first.push({ journey: 'Login' });

    expect(get(second.stack)).toEqual([]);
  });
});

describe('editor demos use the journey contract (IAM-12011 T6)', () => {
  // Matches the `journey` prop only: not `state.journey.step` (store value) and
  // not the `journey.svelte` file name mentioned in comments.
  const journeyMemberPattern = /(?<![.\w])journey\??\.(?!svelte\b)(\w+)/g;

  // Callback demos receive `callback` and `style` props, not `journey`.
  const stageDemos = customComponents.filter((component) => component.kind === 'stage');

  it.each(stageDemos.map((component) => [component.name, component] as const))(
    '%s mocks journey with createDemoJourney, not an ad hoc literal',
    (_name, component) => {
      expect(component.mockProps).toMatch(/journey:\s*createDemoJourney\(/);
      expect(component.mockProps).not.toMatch(/journey:\s*\{/);
    },
  );

  it.each(customComponents.map((component) => [component.name, component] as const))(
    '%s only touches journey members that exist on StageJourneyObject',
    (_name, component) => {
      const usedMembers = [...component.source.matchAll(journeyMemberPattern)].map(
        (match) => match[1],
      );

      expect(usedMembers.filter((member) => !CONTRACT_MEMBERS.includes(member))).toEqual([]);
    },
  );
});
