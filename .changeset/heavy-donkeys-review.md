---
'@forgerock/login-widget': patch
---

Harden the Login2 server: rename `sessions.ts` to `am-session.ts` to reflect its contents, relay AM's real status code and content-type from the token, userinfo, revoke, and end-session proxies instead of always answering 200, preserve end-session's redirect Location and clear the AM cookie on 3xx, send `Cache-Control: no-store` on every session API response, bound the IDM theme cache (journey keys are client-controlled), and log unknown locales at info instead of error.
