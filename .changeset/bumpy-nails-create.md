---
'@forgerock/login-widget': patch
---

Honor terminal login failures: when AM resolves a destination for the journey's failure outcome (`detail.failureUrl` in the `LoginFailure` payload), the widget now completes the journey as failed instead of restarting it, letting the host app act on the failure (for example to honor `gotoOnFail`). Bare failures (wrong password) keep restarting as before.

The login app also fixes its failure redirect: the `gotoOnFail` param is validated on the failure path (AM's `validateGoto` accepts an empty session token), the `successURL` response key is parsed with the correct casing, and a param that is not in the Validation Service no longer wins over AM's resolved failure URL — an unlisted param falls through to the payload's failure URL (e.g. a journey Failure URL node) instead of AM's default success URL.
