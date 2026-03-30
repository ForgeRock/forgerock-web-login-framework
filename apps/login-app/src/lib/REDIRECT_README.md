# Redirects in Login App

This document explains how post-authentication redirect is determined on **success** and **failure**, and explains various redirect flows

## Reference:

- https://docs.pingidentity.com/pingoneaic/am-authentication/redirection-url-precedence.html
- https://github.com/ping-rocks/platform-ui/blob/master/packages/platform-login/src/views/Login/index.vue
- https://github.com/ping-rocks/platform-ui/blob/master/packages/platform-shared/src/mixins/LoginMixin/index.vue

## Functionality

- Redirect users to the correct target after login success or failure
- Prevent open-redirect issues by validating URL against `validateGoto` endpoint
- Handle common edge cases: default console paths, SAML endpoints, admin vs end user defaults, and `gotoOnFail`

## Redirect inputs

Redirect URLs can come from multiple places:

- Query parameters:
  - `goto` (success redirect hint)
  - `gotoOnFail` (failure redirect hint)
- Journey outcome:
  - Success URL from the journey step (for example `step.getSuccessUrl()`)
  - Failure URL from the journey payload (for example `step.payload.detail.failureUrl`)
- AM defaults (applied by AM when validating):
  - User profile success/failure URL attributes
  - Realm default success/failure login URL attributes

## Success and Failure redirection flow (`goto` and `gotoOnFail`)

### 1) Initial request (server)

- Read `goto` / `gotoOnFail` from the incoming URL.
- Normalize into a format AM can consistently validate
- Store the normalized values in a short-lived **HTTP-only** cookie.
  This cookie is cleared after it’s read to avoid stale redirects.

### 2) Authentication completes (client)

The client triggers redirect exactly once

- On success: the client calls the redirect function with:
  - the access token (for authorization)
  - the journey success URL (if present)
  - `isGotoOnFail=false`
- On failure: the client calls the redirect function with:
  - the access token (if available)
  - the `gotoOnFail` query value (if present)
  - `isGotoOnFail=true`
  - the journey-provided `failureUrl` (as a fallback)

The client then navigates via `window.location.assign(...)` using the server’s response, or a safe fallback URL.

### 3) Redirect function picks the final URL (server)

1. Reads and parses the HTTP-only cookie (`goto` / `gotoOnFail`), then deletes it.
2. Selects a possible `gotoUrl`:
   - If `isGotoOnFail=true`: prefer cookie `gotoOnFail`.
   - If `isGotoOnFail=false`: prefer cookie `goto`, otherwise use the client-provided URL (typically from the journey success step).
3. Calls `validateGoto(authorization, gotoUrl)` in AM.
4. If there is no usable `gotoUrl`, compute a default redirect, which redirects to either admin or end user.

AM may return a `successURL` even when the input is invalid. It will fall back to the default success URL.

## Other flows

### Default path

- detects destinations whose last path segment is `console` (for example `/am/console` or `/auth/console`).
- If `validateGoto` returns a non-console URL, use it.
- If `validateGoto` returns a console URL:
  - Failure flow: return an empty redirect so the client can redirect to the journey `failureUrl` or the global fallback.
  - Success flow: if the client provided a non-console URL from the journey, prefer that.

### SAML URLs

If `validateGoto` falls back to a console URL but the original `goto` looks like SAML, return the original `goto`.
For example, when `validateGoto` endpoint returns '/am/console' as successURL and the corresponding `goto` query param is 'https://default.iam.example.com/am/Consumer/metaAlias/avsp', SAML condition becomes true and the `goto` URL is returned

### Admin vs end user default

When there is no usable `goto` (or redirect selection must fall back), the server computes a default destination:

- Verify the access token (`jwtVerify`) and read the subject (`sub`).
- Fetch the user record and determine whether the user is an admin (based on roles/groups).
- Admin users go to an admin landing page; non-admin users go to an end user landing page.

### suspendedIdParam

Some journeys like email verification / magic links / text and sms temporarily **suspend** the authentication session.

In these flows:

1. Customer app is where the flow begins.
2. Customer is redirected to authorization server and then to the Login App for authentication.
3. Login app passes the `goto` and `gotoOnFail` params to AM and AM links this parameter with the active auth session in memory. This happens through the SDK options (`StepOptions.query.goto` and `StepOptions.query.gotoOnFail`).
4. AM stores all of these relevant state params in the `suspendedId`, so the magic link sent to the user contains the `goto` param within this `suspendedId` in the URL.
5. AM then restores the goto URL, and AM is able to send the user to this URL upon completion of the journey (turned into the successURL).
