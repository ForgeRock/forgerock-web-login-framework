# Redirects in Login App

This document explains how post-authentication redirect is determined on success and failure, and explains various redirect flows

## Reference:

- https://docs.pingidentity.com/pingoneaic/am-authentication/redirection-url-precedence.html
- https://github.com/ping-rocks/platform-ui/blob/master/packages/platform-login/src/views/Login/index.vue
- https://github.com/ping-rocks/platform-ui/blob/master/packages/platform-shared/src/mixins/LoginMixin/index.vue

## Functionality

- Redirect users to the correct target after login success or failure
- Prevent open-redirect issues by validating URL against `validateGoto` endpoint
- Handle common edge cases: default console paths, SAML endpoints, admin vs end user redirects

## Redirect inputs

Redirect URLs can come from multiple places:

- Query parameters:
  - `goto` (success)
  - `gotoOnFail` (failure)
- Journey outcome:
  - Success URL from the journey step (for example `step.getSuccessUrl()`)
  - Failure URL from the journey payload (for example `step.payload.detail.failureUrl`)
- AM defaults (applied by AM when validating):
  - User profile success/failure URL attributes
  - Realm default success/failure login URL attributes

## Success and Failure redirection flow (`goto` and `gotoOnFail`)

### 1) Initial request (client)

- When the authentication journey completes on the client, a hidden form is submitted to the server to initiate the redirect flow. This form contains the necessary redirect information (such as success/failure state and URLs).

### 2) Storing redirect params (server)

- Read `goto` / `gotoOnFail` from the incoming URL or from the submitted form.
- Store values in a short-lived **HTTP-only** cookie.

### 3) Redirect function performs the final redirect (server)

1. Read and parse the HTTP-only cookie (`goto` / `gotoOnFail`). This cookie is cleared after it’s read to avoid stale redirects.
2. Select a possible `gotoUrl`:
   - If `isGotoOnFail=true`: prefer cookie `gotoOnFail`.
   - If `isGotoOnFail=false`: prefer cookie `goto`, otherwise use the client-provided URL (typically from the journey success step).
3. Call `validateGoto(authorization, gotoUrl)` in AM. AM may return a `successUrl` even when the input is invalid. It will fall back to the default success URL.
4. If there is no usable `gotoUrl`, compute a default redirect, which redirects to either admin or end user.
5. Final fallback:

- If all redirect logic fails (no valid URL can be determined), the server will redirect to static fallback files:
  - `/success-redirect` for success cases
  - `/failure-redirect` for failure cases
- These files provide a guaranteed fallback destination for both success and failure scenarios.

## Other flows

### Default path

- detect destinations whose last path segment is `console` (for example `/am/console` or `/auth/console`).
- If `validateGoto` return a non-console URL, use it.
- If `validateGoto` return a console URL:
  - Failure flow: return an empty redirect so the client can redirect to the journey `failureUrl` or the global fallback.
  - Success flow: if the client provided a non-console URL from the journey, prefer that.

### SAML URLs

If `validateGoto` falls back to a console URL but the original `goto` looks like SAML, return the original `goto`.
For example, when `validateGoto` endpoint returns '/am/console' as successUrl and the corresponding `goto` query param is 'https://default.iam.example.com/am/Consumer/metaAlias/avsp', SAML condition becomes true and the `goto` URL is returned

### Admin vs end user default

When there is no usable `goto` (or redirect selection must fall back), the server computes a default destination:

- Fetch the user record and determine whether the user is an admin (based on roles/groups).
- Admin users go to an admin landing page; non-admin users go to an end user landing page.

### suspendedIdParam

Some journeys like email verification / magic links / text and sms temporarily **suspend** the authentication session.

In these flows:

1. Customer app is where the flow begins.
2. Customer is redirected to authorization server and then to the Login App for authentication.
3. Login app passes the `goto` and `gotoOnFail` params to AM and AM links this parameter with the active auth session in memory. This happens through the SDK options (`StepOptions.query.goto` and `StepOptions.query.gotoOnFail`).
4. AM stores all of these relevant state params in the `suspendedId`, so the magic link sent to the user contains the `goto` param within this `suspendedId` in the URL.
5. AM then restores the goto URL, and AM is able to send the user to this URL upon completion of the journey (turned into the successUrl).
