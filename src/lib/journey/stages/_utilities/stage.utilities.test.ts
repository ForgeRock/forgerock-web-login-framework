import { describe, expect, it } from 'vitest';

import { matchJourneyAndDecideAction } from './stage.utilities';

describe('Test compare function for requested journey comparison', () => {
  it('should push a new journey to the stack', () => {
    const journeys = [
      {
        journey: 'ResetPassword',
        key: 'forgotPassword',
        match: ['#/service/ResetPassword', '?journey=ResetPassword'],
      },
      {
        journey: 'ForgottenUsername',
        key: 'forgotUsername',
        match: ['#/service/ForgottenUsername', '?journey=ForgottenUsername'],
      },
      {
        journey: undefined,
        key: 'login',
        match: ['#/service/Login', '?journey'],
      },
    ];
    const stack = [
      {
        tree: undefined,
      },
    ];
    const { action, journey } = matchJourneyAndDecideAction('?journey=ResetPassword', journeys, stack);
    expect(action).toBe('push');
    expect(journey).toBe('ResetPassword');
  });

  it('should pop the last journey out of the stack', () => {
    const journeys = [
      {
        journey: 'ResetPassword',
        key: 'forgotPassword',
        match: ['#/service/ResetPassword', '?journey=ResetPassword'],
      },
      {
        journey: 'ForgottenUsername',
        key: 'forgotUsername',
        match: ['#/service/ForgottenUsername', '?journey=ForgottenUsername'],
      },
      {
        journey: undefined,
        key: 'login',
        match: ['#/service/Login', '?journey'],
      },
    ];
    const stack = [
      {
        tree: undefined,
      },
      {
        tree: 'ResetPassword',
      },
    ];
    const { action, journey } = matchJourneyAndDecideAction('?journey', journeys, stack);
    expect(action).toBe('pop');
    expect(journey).toBe(undefined);
  });

  it('should return action of null', () => {
    const journeys = [
      {
        journey: 'ResetPassword',
        key: 'forgotPassword',
        match: ['#/service/ResetPassword', '?journey=ResetPassword'],
      },
      {
        journey: 'ForgottenUsername',
        key: 'forgotUsername',
        match: ['#/service/ForgottenUsername', '?journey=ForgottenUsername'],
      },
      {
        journey: undefined,
        key: 'login',
        match: ['#/service/Login', '?journey'],
      },
    ];
    const stack = [
      {
        tree: undefined,
      },
      {
        tree: 'ResetPassword',
      },
    ];
    const { action, journey } = matchJourneyAndDecideAction('/something', journeys, stack);
    expect(action).toBe(null);
    expect(journey).toBe(undefined);
  });
});
