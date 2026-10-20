/**
 *
 * Copyright © 2026 Ping Identity Corporation. All rights reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * App-local legacy AM anchor compatibility.
 *
 * Live AM links use `#/service/<journey>` (for example
 * `#/service/FRForgotUsername` and `#/service/FRResetPassword`).
 * The login entry historically only read `?journey`/`authIndexValue`
 * and never read `location.hash`, so those anchors changed the hash
 * without starting a journey. This module provides the generic parser
 * and first-mount/hashchange orchestration. No `window`/`location`
 * reads at module scope — callers pass hash/href from inside `onMount`.
 */

export function parseLegacyServiceJourney(hash: string | null | undefined): string {
  if (typeof hash !== 'string' || hash.length === 0) {
    return '';
  }
  if (!hash.startsWith('#')) {
    return '';
  }
  const match = hash.match(/\/service\/([^/?#\s]+)/);
  if (!match || !match[1]) {
    return '';
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function buildLoginEntryQuery(options: {
  goto?: string | null | undefined;
  gotoOnFail?: string | null | undefined;
  uuid?: string | null | undefined;
}): Record<string, string> {
  // noSession false is required to receive session token from AM.
  // Only add goto/gotoOnFail/uuid when present, since undefined would
  // otherwise be serialized as literal "undefined" and corrupt successUrl.
  const query: Record<string, string> = { noSession: 'false' };
  if (options.goto) {
    query.goto = options.goto;
  }
  if (options.gotoOnFail) {
    query.gotoOnFail = options.gotoOnFail;
  }
  if (options.uuid) {
    query.uuid = options.uuid;
  }
  return query;
}

export function shouldResumeEntry(options: {
  suspendedId: string | null | undefined;
  formPostEntry: string | null | undefined;
  code: string | null | undefined;
  state: string | null | undefined;
}): boolean {
  return Boolean(options.suspendedId || options.formPostEntry || (options.code && options.state));
}

export function resolveStartJourney(options: {
  journeyParam: string | null | undefined;
  authIndexValue: string | null | undefined;
  hashJourney: string | null | undefined;
}): string {
  return options.hashJourney || options.journeyParam || options.authIndexValue || '';
}

export type LoginEntryDecision =
  | { kind: 'resume'; isLegacy: boolean }
  | { kind: 'start'; journey: string; query: Record<string, string> };

export function decideLoginEntry(options: {
  suspendedId: string | null | undefined;
  formPostEntry: string | null | undefined;
  code: string | null | undefined;
  state: string | null | undefined;
  journeyParam: string | null | undefined;
  authIndexValue: string | null | undefined;
  hashJourney: string;
  goto?: string | null | undefined;
  gotoOnFail?: string | null | undefined;
  uuid?: string | null | undefined;
}): LoginEntryDecision {
  if (
    shouldResumeEntry({
      suspendedId: options.suspendedId,
      formPostEntry: options.formPostEntry,
      code: options.code,
      state: options.state,
    })
  ) {
    return {
      kind: 'resume',
      // Legacy AM authIndexValue links keep their error/Start Over UI.
      // Modern journey links and bare links retain the store's restart path.
      isLegacy: Boolean(options.suspendedId && options.authIndexValue && !options.journeyParam),
    };
  }
  return {
    kind: 'start',
    journey: resolveStartJourney({
      journeyParam: options.journeyParam,
      authIndexValue: options.authIndexValue,
      hashJourney: options.hashJourney,
    }),
    query: buildLoginEntryQuery({
      goto: options.goto,
      gotoOnFail: options.gotoOnFail,
      uuid: options.uuid,
    }),
  };
}

export async function runWithLegacyAutoRestartGuard<T>(
  getPriorAutoRestart: () => boolean,
  setAutoRestart: (value: boolean) => void,
  work: () => Promise<T>,
): Promise<T> {
  const prior = getPriorAutoRestart();
  setAutoRestart(false);
  try {
    return await work();
  } finally {
    setAutoRestart(prior);
  }
}

export interface RunInitialEntryInputs {
  href: string;
  hash: string;
  suspendedId: string | null | undefined;
  formPostEntry: string | null | undefined;
  code: string | null | undefined;
  state: string | null | undefined;
  journeyParam: string | null | undefined;
  authIndexValue: string | null | undefined;
  goto?: string | null | undefined;
  gotoOnFail?: string | null | undefined;
  uuid?: string | null | undefined;
}

export interface RunInitialEntryDeps {
  resume: (href: string) => Promise<void> | void;
  start: (options: { journey: string; query: Record<string, string> }) => Promise<void> | void;
  replaceState: (url: string) => Promise<void> | void;
  getPriorAutoRestart: () => boolean;
  setAutoRestart: (value: boolean) => void;
  getResumeState: () =>
    | { completed?: boolean | null; successful?: boolean | null }
    | null
    | undefined;
}

export type RunInitialEntryOutcome =
  | { kind: 'resumed' }
  | { kind: 'resumed-legacy-failed'; legacyFailed: true }
  | { kind: 'started'; journey: string; query: Record<string, string> };

export function cleanResumeUrl(href: string): string {
  const url = new URL(href);
  for (const name of ['suspendedId', 'form_post_entry', 'code', 'state']) {
    url.searchParams.delete(name);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function runInitialEntry(
  inputs: RunInitialEntryInputs,
  deps: RunInitialEntryDeps,
): Promise<RunInitialEntryOutcome> {
  const hashJourney = parseLegacyServiceJourney(inputs.hash);
  const decision = decideLoginEntry({
    suspendedId: inputs.suspendedId,
    formPostEntry: inputs.formPostEntry,
    code: inputs.code,
    state: inputs.state,
    journeyParam: inputs.journeyParam,
    authIndexValue: inputs.authIndexValue,
    hashJourney,
    goto: inputs.goto,
    gotoOnFail: inputs.gotoOnFail,
    uuid: inputs.uuid,
  });
  if (decision.kind === 'resume') {
    if (decision.isLegacy) {
      try {
        await runWithLegacyAutoRestartGuard(deps.getPriorAutoRestart, deps.setAutoRestart, () =>
          Promise.resolve(deps.resume(inputs.href)),
        );
      } catch {
        return { kind: 'resumed-legacy-failed', legacyFailed: true };
      }
      const state = deps.getResumeState ? deps.getResumeState() : null;
      if (state?.completed && !state?.successful) {
        return { kind: 'resumed-legacy-failed', legacyFailed: true };
      }
      await deps.replaceState(cleanResumeUrl(inputs.href));
      return { kind: 'resumed' };
    }
    await deps.resume(inputs.href);
    await deps.replaceState(cleanResumeUrl(inputs.href));
    return { kind: 'resumed' };
  }
  await deps.start({ journey: decision.journey, query: decision.query });
  return { kind: 'started', journey: decision.journey, query: decision.query };
}

export interface LegacyHashWindowLike {
  location: { hash: string };
  addEventListener: (type: 'hashchange', listener: () => void) => void;
  removeEventListener: (type: 'hashchange', listener: () => void) => void;
}

export function attachLegacyHashListener(
  win: LegacyHashWindowLike,
  onLegacyJourney: (journey: string) => void,
): () => void {
  const handler = (): void => {
    const journey = parseLegacyServiceJourney(win.location.hash);
    if (journey) {
      onLegacyJourney(journey);
    }
  };
  win.addEventListener('hashchange', handler);
  return () => win.removeEventListener('hashchange', handler);
}
