---
'@forgerock/login-widget': patch
---

Internal build restructure with no public API, behavior or dependency change: the shared journey logic, stores and components (formerly the `core/` directory sources compiled inline by the widget's own build) now ship as a private `login-framework` workspace package that is built once to its own dist and inlined into the widget's ESM and IIFE outputs. The published outputs stay functionally equivalent; npm consumers are unaffected.
