---
'@forgerock/login-app': patch
---

Add Prometheus metrics for the login app: per-route request counts and latency, upstream AM call counts and latency by bounded endpoint label, IDM theme fetch outcomes, redirect validation outcomes, and a dedicated /metrics listener on METRICS_PORT that is excluded from customer traffic.
