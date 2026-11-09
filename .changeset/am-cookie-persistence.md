---
'@forgerock/login-widget': patch
---

Forward the upstream AM cookie's `Max-Age` / `Expires` attributes through the Login2 app's AM proxy (authenticate route), so the browser keeps the session for as long as AM intends instead of forcing a session cookie. The `Domain` attribute remains omitted, keeping the cookie host-only for the tenant's browser.
