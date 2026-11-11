---
'@forgerock/login-widget': patch
---

Include Svelte as a production dependency so framework-agnostic TypeScript consumers can resolve the widget's published component declarations and instantiate `new Widget({ target, props })` without adding Svelte themselves.
