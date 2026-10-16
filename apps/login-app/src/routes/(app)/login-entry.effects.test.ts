/**
 *
 * Copyright © 2026 Ping Identity Corporation. All rights reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

import {
  attachLegacyHashListener,
  buildLoginEntryQuery,
  decideLoginEntry,
  parseLegacyServiceJourney,
  resolveStartJourney,
  runInitialEntry,
  runWithLegacyAutoRestartGuard,
  shouldResumeEntry,
} from './login-entry.effects';

function createFakeWindow(initialHash = '') {
  const handlers = new Set<() => void>();
  return {
    location: { hash: initialHash },
    addEventListener: vi.fn((_type: string, fn: () => void) => {
      handlers.add(fn);
    }),
    removeEventListener: vi.fn((_type: string, fn: () => void) => {
      handlers.delete(fn);
    }),
    fireHashChange: () => {
      handlers.forEach((fn) => fn());
    },
    handlerCount: () => handlers.size,
  };
}

describe('parseLegacyServiceJourney', () => {
  it('extracts FRForgotUsername from legacy hash', () => {
    expect(parseLegacyServiceJourney('#/service/FRForgotUsername')).toBe('FRForgotUsername');
  });

  it('extracts FRResetPassword from legacy hash', () => {
    expect(parseLegacyServiceJourney('#/service/FRResetPassword')).toBe('FRResetPassword');
  });

  it('extracts a generic future journey', () => {
    expect(parseLegacyServiceJourney('#/service/FutureJourney')).toBe('FutureJourney');
  });

  it('ignores bad hashes', () => {
    expect(parseLegacyServiceJourney('')).toBe('');
    expect(parseLegacyServiceJourney(null)).toBe('');
    expect(parseLegacyServiceJourney(undefined)).toBe('');
    expect(parseLegacyServiceJourney('#')).toBe('');
    expect(parseLegacyServiceJourney('#/foo')).toBe('');
    expect(parseLegacyServiceJourney('#/service/')).toBe('');
    expect(parseLegacyServiceJourney('#/service')).toBe('');
    expect(parseLegacyServiceJourney('/service/FRForgotUsername')).toBe('');
    expect(parseLegacyServiceJourney('FRForgotUsername')).toBe('');
  });

  it('is generic for realm-prefixed service paths', () => {
    expect(parseLegacyServiceJourney('#/realms/alpha/service/FRForgotUsername')).toBe(
      'FRForgotUsername',
    );
  });
});

describe('buildLoginEntryQuery', () => {
  it('always includes noSession false and preserves goto/gotoOnFail/uuid', () => {
    expect(
      buildLoginEntryQuery({
        goto: 'https://app.example.com',
        gotoOnFail: 'https://fail.example.com',
        uuid: 'u-1',
      }),
    ).toEqual({
      noSession: 'false',
      goto: 'https://app.example.com',
      gotoOnFail: 'https://fail.example.com',
      uuid: 'u-1',
    });
  });

  it('omits missing values instead of serializing undefined', () => {
    const query = buildLoginEntryQuery({ goto: undefined, gotoOnFail: null, uuid: undefined });
    expect(query).toEqual({ noSession: 'false' });
    expect(JSON.stringify(query)).not.toContain('undefined');
  });
});

describe('shouldResumeEntry', () => {
  it('resumes for suspendedId, form_post_entry, and code+state', () => {
    expect(
      shouldResumeEntry({ suspendedId: 's', formPostEntry: null, code: null, state: null }),
    ).toBe(true);
    expect(
      shouldResumeEntry({ suspendedId: null, formPostEntry: 'fp', code: null, state: null }),
    ).toBe(true);
    expect(
      shouldResumeEntry({ suspendedId: null, formPostEntry: null, code: 'c', state: 's' }),
    ).toBe(true);
  });

  it('does not resume for partial or empty params', () => {
    expect(
      shouldResumeEntry({ suspendedId: null, formPostEntry: null, code: 'c', state: null }),
    ).toBe(false);
    expect(
      shouldResumeEntry({ suspendedId: null, formPostEntry: null, code: null, state: 's' }),
    ).toBe(false);
    expect(
      shouldResumeEntry({ suspendedId: null, formPostEntry: null, code: null, state: null }),
    ).toBe(false);
  });
});

describe('resolveStartJourney', () => {
  it('prefers hash journey over query and authIndexValue', () => {
    expect(
      resolveStartJourney({
        journeyParam: 'Login',
        authIndexValue: 'AdminOnboarding',
        hashJourney: 'FRForgotUsername',
      }),
    ).toBe('FRForgotUsername');
  });

  it('falls back to journeyParam then authIndexValue', () => {
    expect(
      resolveStartJourney({
        journeyParam: 'Login',
        authIndexValue: 'AdminOnboarding',
        hashJourney: '',
      }),
    ).toBe('Login');
    expect(
      resolveStartJourney({
        journeyParam: null,
        authIndexValue: 'AdminOnboarding',
        hashJourney: '',
      }),
    ).toBe('AdminOnboarding');
    expect(resolveStartJourney({ journeyParam: null, authIndexValue: null, hashJourney: '' })).toBe(
      '',
    );
  });
});

describe('decideLoginEntry', () => {
  it('gives resume precedence even when a legacy hash is present', () => {
    const decision = decideLoginEntry({
      suspendedId: 'suspended-1',
      formPostEntry: null,
      code: null,
      state: null,
      journeyParam: 'Login',
      authIndexValue: 'AdminOnboarding',
      hashJourney: 'FRForgotUsername',
      goto: undefined,
      gotoOnFail: undefined,
      uuid: undefined,
    });
    expect(decision).toEqual({ kind: 'resume', isLegacy: false });
  });

  it('starts the hash journey with preserved query', () => {
    const decision = decideLoginEntry({
      suspendedId: null,
      formPostEntry: null,
      code: null,
      state: null,
      journeyParam: 'Login',
      authIndexValue: 'AdminOnboarding',
      hashJourney: 'FRResetPassword',
      goto: 'https://app.example.com',
      gotoOnFail: undefined,
      uuid: 'u-1',
    });
    expect(decision).toEqual({
      kind: 'start',
      journey: 'FRResetPassword',
      query: { noSession: 'false', goto: 'https://app.example.com', uuid: 'u-1' },
    });
  });

  it('ignores empty hash journey and uses query identity', () => {
    const decision = decideLoginEntry({
      suspendedId: null,
      formPostEntry: null,
      code: null,
      state: null,
      journeyParam: 'Login',
      authIndexValue: 'AdminOnboarding',
      hashJourney: '',
      goto: undefined,
      gotoOnFail: undefined,
      uuid: undefined,
    });
    expect(decision).toEqual({
      kind: 'start',
      journey: 'Login',
      query: { noSession: 'false' },
    });
  });
});

describe('runWithLegacyAutoRestartGuard', () => {
  it('sets false during work and restores prior true', async () => {
    let value = true;
    const seen: boolean[] = [];
    const result = await runWithLegacyAutoRestartGuard(
      () => value,
      (v) => {
        value = v;
      },
      async () => {
        seen.push(value);
        return 'ok';
      },
    );
    expect(result).toBe('ok');
    expect(seen).toEqual([false]);
    expect(value).toBe(true);
  });

  it('restores prior false', async () => {
    let value = false;
    await runWithLegacyAutoRestartGuard(
      () => value,
      (v) => {
        value = v;
      },
      async () => {},
    );
    expect(value).toBe(false);
  });

  it('restores prior even when work throws', async () => {
    let value = true;
    const setSpy = vi.fn((v: boolean) => {
      value = v;
    });
    await expect(
      runWithLegacyAutoRestartGuard(
        () => value,
        setSpy,
        async () => {
          expect(value).toBe(false);
          throw new Error('boom');
        },
      ),
    ).rejects.toThrow('boom');
    expect(value).toBe(true);
    expect(setSpy).toHaveBeenCalledTimes(2);
    expect(setSpy.mock.calls[0]?.[0]).toBe(false);
    expect(setSpy.mock.calls[1]?.[0]).toBe(true);
  });
});

describe('runInitialEntry first mount orchestration', () => {
  it('starts hash journey once with preserved query and no resume/goto', async () => {
    const resume = vi.fn(async () => {});
    const start = vi.fn(async () => {});
    const gotoMock = vi.fn(async () => {});
    let autoRestart = true;
    const outcome = await runInitialEntry(
      {
        href: 'https://login.example.com/login/',
        hash: '#/service/FRForgotUsername',
        suspendedId: null,
        formPostEntry: null,
        code: null,
        state: null,
        journeyParam: 'Login',
        authIndexValue: 'AdminOnboarding',
        goto: 'https://app.example.com',
        gotoOnFail: 'https://fail.example.com',
        uuid: 'uuid-1',
      },
      {
        resume,
        start,
        goto: gotoMock,
        getPriorAutoRestart: () => autoRestart,
        setAutoRestart: (v) => {
          autoRestart = v;
        },
        getResumeState: () => null,
      },
    );
    expect(resume).not.toHaveBeenCalled();
    expect(gotoMock).not.toHaveBeenCalled();
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith({
      journey: 'FRForgotUsername',
      query: {
        noSession: 'false',
        goto: 'https://app.example.com',
        gotoOnFail: 'https://fail.example.com',
        uuid: 'uuid-1',
      },
    });
    expect(outcome).toEqual({
      kind: 'started',
      journey: 'FRForgotUsername',
      query: {
        noSession: 'false',
        goto: 'https://app.example.com',
        gotoOnFail: 'https://fail.example.com',
        uuid: 'uuid-1',
      },
    });
    expect(autoRestart).toBe(true);
  });

  it('ignores bad hash and falls back to query identity', async () => {
    const resume = vi.fn(async () => {});
    const start = vi.fn(async () => {});
    const gotoMock = vi.fn(async () => {});
    await runInitialEntry(
      {
        href: 'https://login.example.com/login/',
        hash: '#/foo',
        suspendedId: null,
        formPostEntry: null,
        code: null,
        state: null,
        journeyParam: 'Login',
        authIndexValue: 'AdminOnboarding',
        goto: undefined,
        gotoOnFail: undefined,
        uuid: undefined,
      },
      {
        resume,
        start,
        goto: gotoMock,
        getPriorAutoRestart: () => true,
        setAutoRestart: () => {},
        getResumeState: () => null,
      },
    );
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith({ journey: 'Login', query: { noSession: 'false' } });
  });

  it('gives suspended resume precedence over hash without a second start', async () => {
    const resume = vi.fn(async () => {});
    const start = vi.fn(async () => {});
    const gotoMock = vi.fn(async () => {});
    let autoRestart = true;
    const outcome = await runInitialEntry(
      {
        href: 'https://login.example.com/login/?suspendedId=s1&authIndexValue=AdminOnboarding',
        hash: '#/service/FRForgotUsername',
        suspendedId: 's1',
        formPostEntry: null,
        code: null,
        state: null,
        journeyParam: 'Login',
        authIndexValue: 'AdminOnboarding',
        goto: undefined,
        gotoOnFail: undefined,
        uuid: undefined,
      },
      {
        resume,
        start,
        goto: gotoMock,
        getPriorAutoRestart: () => autoRestart,
        setAutoRestart: (v) => {
          autoRestart = v;
        },
        getResumeState: () => ({ completed: false, successful: false }),
      },
    );
    expect(resume).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledWith(
      'https://login.example.com/login/?suspendedId=s1&authIndexValue=AdminOnboarding',
    );
    expect(start).not.toHaveBeenCalled();
    expect(gotoMock).toHaveBeenCalledTimes(1);
    expect(gotoMock).toHaveBeenCalledWith('/', expect.objectContaining({ replaceState: true }));
    expect(outcome).toEqual({ kind: 'resumed' });
    expect(autoRestart).toBe(true);
  });

  it('reports legacy failure without goto when store is completed unsuccessful', async () => {
    const resume = vi.fn(async () => {});
    const start = vi.fn(async () => {});
    const gotoMock = vi.fn(async () => {});
    let autoRestart = true;
    const outcome = await runInitialEntry(
      {
        href: 'https://login.example.com/login/?suspendedId=bad',
        hash: '',
        suspendedId: 'bad',
        formPostEntry: null,

        code: null,
        state: null,
        journeyParam: null,
        authIndexValue: 'AdminOnboarding',
        goto: undefined,
        gotoOnFail: undefined,
        uuid: undefined,
      },
      {
        resume,
        start,
        goto: gotoMock,
        getPriorAutoRestart: () => autoRestart,
        setAutoRestart: (v) => {
          autoRestart = v;
        },
        getResumeState: () => ({ completed: true, successful: false }),
      },
    );
    expect(resume).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(gotoMock).not.toHaveBeenCalled();
    expect(outcome).toEqual({ kind: 'resumed-legacy-failed', legacyFailed: true });
    expect(autoRestart).toBe(true);
  });

  it('reports legacy failure when resume rejects and restores prior autoRestart', async () => {
    const resume = vi.fn(async () => {
      throw new Error('expired');
    });
    const start = vi.fn(async () => {});
    const gotoMock = vi.fn(async () => {});
    let autoRestart = true;
    const setSpy = vi.fn((v: boolean) => {
      autoRestart = v;
    });
    const outcome = await runInitialEntry(
      {
        href: 'https://login.example.com/login/?suspendedId=bad',
        hash: '',
        suspendedId: 'bad',
        formPostEntry: null,
        code: null,
        state: null,
        journeyParam: null,
        authIndexValue: 'AdminOnboarding',
        goto: undefined,
        gotoOnFail: undefined,
        uuid: undefined,
      },
      {
        resume,
        start,
        goto: gotoMock,
        getPriorAutoRestart: () => autoRestart,
        setAutoRestart: setSpy,
        getResumeState: () => null,
      },
    );
    expect(resume).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(gotoMock).not.toHaveBeenCalled();
    expect(outcome).toEqual({ kind: 'resumed-legacy-failed', legacyFailed: true });
    expect(autoRestart).toBe(true);
    expect(setSpy).toHaveBeenCalledTimes(2);
    expect(setSpy.mock.calls[0]?.[0]).toBe(false);
    expect(setSpy.mock.calls[1]?.[0]).toBe(true);
  });

  it('preserves successful legacy resume with goto cleanup and restored autoRestart', async () => {
    const resume = vi.fn(async () => {});
    const start = vi.fn(async () => {});
    const gotoMock = vi.fn(async () => {});
    let autoRestart = true;
    const outcome = await runInitialEntry(
      {
        href: 'https://login.example.com/login/?suspendedId=good',
        hash: '',
        suspendedId: 'good',
        formPostEntry: null,
        code: null,
        state: null,
        journeyParam: null,
        authIndexValue: 'AdminOnboarding',
        goto: undefined,
        gotoOnFail: undefined,
        uuid: undefined,
      },
      {
        resume,
        start,
        goto: gotoMock,
        getPriorAutoRestart: () => autoRestart,
        setAutoRestart: (v) => {
          autoRestart = v;
        },
        getResumeState: () => ({ completed: true, successful: true }),
      },
    );
    expect(resume).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(gotoMock).toHaveBeenCalledTimes(1);
    expect(gotoMock).toHaveBeenCalledWith('/', expect.objectContaining({ replaceState: true }));
    expect(outcome).toEqual({ kind: 'resumed' });
    expect(autoRestart).toBe(true);
  });

  it.each([true, false])(
    'preserves autoRestart=%s for a bare suspended link',
    async (priorAutoRestart) => {
      let autoRestart = priorAutoRestart;
      const setAutoRestart = vi.fn((value: boolean) => {
        autoRestart = value;
      });
      // The store owns remembered/default restart resolution. Entry orchestration
      // must not disable that path for a suspended link without journey identity.
      const resume = vi.fn(async () => {
        expect(autoRestart).toBe(priorAutoRestart);
      });
      const start = vi.fn(async () => {});
      const gotoMock = vi.fn(async () => {});
      const outcome = await runInitialEntry(
        {
          href: 'https://login.example.com/login/?suspendedId=expired',
          hash: '',
          suspendedId: 'expired',
          formPostEntry: null,
          code: null,
          state: null,
          journeyParam: null,
          authIndexValue: null,
        },
        {
          resume,
          start,
          goto: gotoMock,
          getPriorAutoRestart: () => autoRestart,
          setAutoRestart,
          getResumeState: () => ({ completed: false, successful: false }),
        },
      );
      expect(resume).toHaveBeenCalledTimes(1);
      expect(resume).toHaveBeenCalledWith('https://login.example.com/login/?suspendedId=expired');
      expect(start).not.toHaveBeenCalled();
      expect(setAutoRestart).not.toHaveBeenCalled();
      expect(gotoMock).toHaveBeenCalledWith('/', { replaceState: true });
      expect(outcome).toEqual({ kind: 'resumed' });
      expect(autoRestart).toBe(priorAutoRestart);
    },
  );

  it.each([null, 'AdminOnboarding'])(
    'keeps modern journey restart enabled with authIndexValue=%s',
    async (authIndexValue) => {
      let autoRestart = true;
      const setAutoRestart = vi.fn((value: boolean) => {
        autoRestart = value;
      });
      const restartedJourneys: string[] = [];
      // resume() records the explicit journey before handling an expired link.
      // Its failure handler can restart that target only if autoRestart stays on.
      const resume = vi.fn(async () => {
        if (autoRestart) restartedJourneys.push('TEST_LoginSuspendEmail');
      });
      const start = vi.fn(async () => {});
      const gotoMock = vi.fn(async () => {});
      const href =
        'https://login.example.com/login/?journey=TEST_LoginSuspendEmail&suspendedId=expired';
      const outcome = await runInitialEntry(
        {
          href,
          hash: '',
          suspendedId: 'expired',
          formPostEntry: null,
          code: null,
          state: null,
          journeyParam: 'TEST_LoginSuspendEmail',
          authIndexValue,
        },
        {
          resume,
          start,
          goto: gotoMock,
          getPriorAutoRestart: () => autoRestart,
          setAutoRestart,
          getResumeState: () => ({ completed: false, successful: false }),
        },
      );
      expect(resume).toHaveBeenCalledTimes(1);
      expect(resume).toHaveBeenCalledWith(href);
      expect(restartedJourneys).toEqual(['TEST_LoginSuspendEmail']);
      expect(setAutoRestart).not.toHaveBeenCalled();
      expect(start).not.toHaveBeenCalled();
      expect(gotoMock).toHaveBeenCalledWith('/', { replaceState: true });
      expect(outcome).toEqual({ kind: 'resumed' });
      expect(autoRestart).toBe(true);
    },
  );

  it('keeps OAuth code+state and formpost resume without legacy autoRestart toggle', async () => {
    const resume = vi.fn(async () => {});
    const start = vi.fn(async () => {});
    const gotoMock = vi.fn(async () => {});
    const setAutoRestart = vi.fn();
    const oauthOutcome = await runInitialEntry(
      {
        href: 'https://login.example.com/login/?code=c&state=s',
        hash: '#/service/FRForgotUsername',
        suspendedId: null,
        formPostEntry: null,
        code: 'c',
        state: 's',
        journeyParam: null,
        authIndexValue: null,
        goto: undefined,
        gotoOnFail: undefined,
        uuid: undefined,
      },
      {
        resume,
        start,
        goto: gotoMock,
        getPriorAutoRestart: () => true,
        setAutoRestart,
        getResumeState: () => ({ completed: false, successful: false }),
      },
    );
    expect(oauthOutcome).toEqual({ kind: 'resumed' });
    expect(resume).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(gotoMock).toHaveBeenCalledTimes(1);
    expect(setAutoRestart).not.toHaveBeenCalled();

    const formpostResume = vi.fn(async () => {});
    const formpostGoto = vi.fn(async () => {});
    const formpostStart = vi.fn(async () => {});
    const formpostOutcome = await runInitialEntry(
      {
        href: 'https://login.example.com/login/?form_post_entry=fp',
        hash: '',
        suspendedId: null,
        formPostEntry: 'fp',
        code: null,
        state: null,
        journeyParam: null,
        authIndexValue: null,
        goto: undefined,
        gotoOnFail: undefined,
        uuid: undefined,
      },
      {
        resume: formpostResume,
        start: formpostStart,
        goto: formpostGoto,
        getPriorAutoRestart: () => true,
        setAutoRestart,
        getResumeState: () => ({ completed: false, successful: false }),
      },
    );
    expect(formpostOutcome).toEqual({ kind: 'resumed' });
    expect(formpostResume).toHaveBeenCalledTimes(1);
    expect(formpostStart).not.toHaveBeenCalled();
    expect(formpostGoto).toHaveBeenCalledTimes(1);
  });
});

describe('attachLegacyHashListener hashchange', () => {
  it('calls back for legacy hashchange and ignores bad hash', async () => {
    const win = createFakeWindow('');
    const onLegacyJourney = vi.fn();
    const detach = attachLegacyHashListener(win, onLegacyJourney);
    expect(win.addEventListener).toHaveBeenCalledTimes(1);

    win.location.hash = '#/service/FRForgotUsername';
    win.fireHashChange();
    expect(onLegacyJourney).toHaveBeenCalledTimes(1);
    expect(onLegacyJourney).toHaveBeenCalledWith('FRForgotUsername');

    win.location.hash = '#/service/FRResetPassword';
    win.fireHashChange();
    expect(onLegacyJourney).toHaveBeenCalledTimes(2);
    expect(onLegacyJourney).toHaveBeenCalledWith('FRResetPassword');

    onLegacyJourney.mockClear();
    win.location.hash = '#/foo';
    win.fireHashChange();
    expect(onLegacyJourney).not.toHaveBeenCalled();

    win.location.hash = '';
    win.fireHashChange();
    expect(onLegacyJourney).not.toHaveBeenCalled();

    detach();
  });

  it('removes hashchange listener on cleanup', () => {
    const win = createFakeWindow('#/service/FRForgotUsername');
    const onLegacyJourney = vi.fn();
    expect(win.handlerCount()).toBe(0);
    const detach = attachLegacyHashListener(win, onLegacyJourney);
    expect(win.handlerCount()).toBe(1);
    expect(win.removeEventListener).not.toHaveBeenCalled();
    detach();
    expect(win.removeEventListener).toHaveBeenCalledTimes(1);
    expect(win.handlerCount()).toBe(0);
    win.location.hash = '#/service/FRResetPassword';
    win.fireHashChange();
    expect(onLegacyJourney).not.toHaveBeenCalled();
  });
});
