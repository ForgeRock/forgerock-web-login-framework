/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Prometheus metrics for the Login App 2.0 (aic-login2, IAM-11568).
 *
 * Statelessness constraint: requests may land on any replica, so all metric
 * state is per-process; Prometheus scrapes each pod separately and the
 * dashboards aggregate across replicas. A single module-global registry is
 * exported so the dedicated /metrics listener serves `registry.metrics()`.
 *
 * Cardinality: label values are limited to fixed sets — the app's own route
 * names, AM endpoint names, HTTP status classes, and fixed theme-fetch and
 * redirect outcomes. There is deliberately no `sub`, session id, realm, or
 * journey-name label: identity stays in structured logs, and customer-authored
 * journey trees are unbounded, matching the aic-mcp label discipline
 * (IAM-11805).
 */

import client from 'prom-client';

export const LOGIN_APP_METRICS_PREFIX = 'login_app_';

const registry = new client.Registry();

// ── Counters ─────────────────────────────────────────────────────────────────

/**
 * Every inbound app request, by route, method, and HTTP status code. Routes
 * are the fixed set of server route ids (page routes normalized to their
 * route id), so the series count is bounded. Response codes relayed from AM
 * still count here under the app route that relayed them — this is the
 * edge-to-app view; upstream health lives in am_requests_total.
 */
export const appRequestsTotal = new client.Counter({
  name: `${LOGIN_APP_METRICS_PREFIX}requests_total`,
  help: 'Total inbound requests, by route, method, and HTTP status code.',
  labelNames: ['route', 'method', 'code'] as const,
  registers: [registry],
});

/** Every upstream AM call made by the app, by AM endpoint and status class. */
export const amRequestsTotal = new client.Counter({
  name: `${LOGIN_APP_METRICS_PREFIX}am_requests_total`,
  help: 'Total upstream AM calls from the app, by endpoint and HTTP status class (2xx, 4xx, 5xx, error).',
  labelNames: ['endpoint', 'code'] as const,
  registers: [registry],
});

/**
 * IDM theme fetches, by outcome: success (fetched and parsed), cache (served
 * from the failure-fallback cache after an error), error (network failure or
 * non-2xx), and invalid (response not parseable as JSON).
 */
export const themeFetchesTotal = new client.Counter({
  name: `${LOGIN_APP_METRICS_PREFIX}theme_fetches_total`,
  help: 'Total IDM theme fetches, by outcome (success | cache | error | invalid_json).',
  labelNames: ['outcome'] as const,
  registers: [registry],
});

/**
 * AM-side redirect validations (validateGoto), by outcome. accepted means AM
 * returned a successUrl; rejected means the validation response carried no
 * usable successUrl.
 */
export const redirectValidationsTotal = new client.Counter({
  name: `${LOGIN_APP_METRICS_PREFIX}redirect_validations_total`,
  help: 'Total AM redirect validations, by outcome (accepted | rejected | error).',
  labelNames: ['outcome'] as const,
  registers: [registry],
});

// ── Histograms ───────────────────────────────────────────────────────────────

/** Latency of handling a complete request, by route, including upstream wait. */
const appRequestDuration = new client.Histogram({
  name: `${LOGIN_APP_METRICS_PREFIX}request_duration_seconds`,
  help: 'Duration of inbound request handling in seconds, by route.',
  labelNames: ['route'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

/** Latency of upstream AM calls, by AM endpoint. */
const amRequestDuration = new client.Histogram({
  name: `${LOGIN_APP_METRICS_PREFIX}am_request_duration_seconds`,
  help: 'Duration of upstream AM calls in seconds, by endpoint.',
  labelNames: ['endpoint'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

/** Latency of IDM theme fetches. */
const themeFetchDuration = new client.Histogram({
  name: `${LOGIN_APP_METRICS_PREFIX}theme_fetch_duration_seconds`,
  help: 'Duration of IDM theme fetches in seconds.',
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [registry],
});

// ── Gauges ───────────────────────────────────────────────────────────────────

/** In-flight requests being handled by this replica. */
export const appInflightRequests = new client.Gauge({
  name: `${LOGIN_APP_METRICS_PREFIX}inflight_requests`,
  help: 'Current number of in-flight requests on this replica.',
  registers: [registry],
});

/** 1 while the process is serving; a dead pod's series disappears on the next scrape. */
export const appUp = new client.Gauge({
  name: `${LOGIN_APP_METRICS_PREFIX}up`,
  help: '1 when the login app process is serving metrics.',
  registers: [registry],
});

appUp.set(1);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map an HTTP status or error to the bounded status-class label value. */
export function statusCodeClass(status: number | undefined): string {
  if (status === undefined) return 'error';
  const match = /^[1-5]/.exec(String(status));
  return match ? `${match[0]}xx` : 'error';
}

/**
 * Route label for a SvelteKit event: server API routes keep their full path,
 * page routes collapse to their SvelteKit route id so customer page URLs
 * (goto params etc.) cannot enter the label set.
 */
export function routeLabel(event: { url: URL; route?: { id: string | null } }): string {
  if (event.url.pathname.startsWith('/api/')) return event.url.pathname;
  return event.route?.id ?? 'other';
}

/**
 * AM endpoint label: the app's fixed call surface (authenticate, authorize,
 * endSession, revoke, access_token, userinfo, sessions, users), so
 * realm-specific paths collapse to the endpoint name and subresource ids
 * (e.g. /users/{id}) cannot enter the label set. Unknown paths become
 * `other`.
 */
const AM_ENDPOINTS = new Set([
  'authenticate',
  'authorize',
  'endSession',
  'revoke',
  'access_token',
  'userinfo',
  'sessions',
  'users',
]);

export function amEndpointLabel(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments.at(-1);
  if (last && AM_ENDPOINTS.has(last)) return last;
  const parent = segments.at(-2);
  if (parent && AM_ENDPOINTS.has(parent)) return parent;
  return 'other';
}

/** Record one completed inbound request. */
export function recordAppRequest(
  route: string,
  method: string,
  code: number,
  durationSeconds: number,
): void {
  appRequestsTotal.inc({ route, method, code: String(code) });
  appRequestDuration.observe({ route }, durationSeconds);
}

/** Record one completed upstream AM call. */
export function recordAmRequest(
  endpoint: string,
  code: number | undefined,
  durationSeconds: number,
): void {
  amRequestsTotal.inc({ endpoint, code: statusCodeClass(code) });
  amRequestDuration.observe({ endpoint }, durationSeconds);
}

/** Record one IDM theme fetch outcome with its duration. */
export function recordThemeFetch(
  outcome: 'success' | 'cache' | 'error' | 'invalid_json',
  durationSeconds: number,
): void {
  themeFetchesTotal.inc({ outcome });
  themeFetchDuration.observe(durationSeconds);
}

/** Record one AM redirect validation. */
export function recordRedirectValidation(outcome: 'accepted' | 'rejected' | 'error'): void {
  redirectValidationsTotal.inc({ outcome });
}

/** Render the registry in Prometheus text exposition format. */
export async function renderMetrics(): Promise<string> {
  return registry.metrics();
}

/** Test-only: clear every recorded series between suites. */
export function registryReset(): void {
  registry.resetMetrics();
}
