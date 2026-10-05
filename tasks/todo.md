# Comment documentation cleanup

## Plan

- [x] Inventory comment blocks introduced after merge-base `d68fb197` and classify each as public API documentation, non-obvious invariant, or redundant narration.
- [x] Replace retained documentation with one consistent Effect-style JSDoc contract: purpose, conditional **When to use** / **Gotchas**, `@see`, executable **Example** where a consumer can use the symbol, and `@category`. Do not add `@since`: login-app is not versioned.
- [x] Remove redundant comments and avoid documenting obvious local implementation steps; retain only comments that state a non-obvious behavior, constraint, or safety invariant.
- [x] Keep changes strictly limited to files introduced or modified by this branch.
- [x] Run formatting, targeted unit tests, and lint/type checks appropriate to the touched login-app code.

## Review

- Added consistent categorized Effect-style JSDoc to branch-added Component API schemas, services, layers, operations, runtime composition, and HTTP route handlers.
- Removed redundant test narration and the inline rename-loop implementation comment; preserved the atomic-per-file persistence limitation as a service-level gotcha.
- Verified `lsp_diagnostics` for the edited Effect modules (no diagnostics), Prettier, `git diff --check`, and 51 targeted login-app server tests.
