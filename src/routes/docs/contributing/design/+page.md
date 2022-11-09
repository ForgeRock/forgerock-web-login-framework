## Design Principles

### Overarching goals

1. Low-code asset for authentication/authorization
2. Ease of use with strong, opinionated defaults
3. Highly performant and secure
4. Standards-based and accessible
5. Modern and maintainable
6. Installable via NPM or `<script>` tag
7. Framework/library agnostic
8. Configurable
9. Themable with default light and dark mode
10. Supports internationalization/localization

### Technical requirements

1. Project uses framework that produces a full-stack, highly scalable, deployable application compatible with basic Node installations or special, “edge-first” deployments like Vercel, Netlify and/or Cloudflare
2. Project uses Universal Architectural design; meaning, the same codebase is used both for server and browser environments
3. Project’s framework provides built-in server, configurable for localhost, self-signed certs, CORS, CSP, HTTPS for both rendering and seamless integration for providing APIs
4. Project can support highest security protocols: third-party cookie disablement, IAM platform with CORS off, strictest CSP configuration, no token operation, confidential client support, token encryption, SSL pinning
5. Project has value as decomposed independent layers (SPA, full-stack, API, widget … )
6. Server is compatible with in-memory stores like Redis for session storage/management
7. Does not “ship” with a framework requirement (framework is “compiled” away)
8. Maximize reusable, generic code; minimize “framework specific” code
9. Installable Widget is generated/packaged from the same codebase of the standalone Login App with a deployable backend
10. Widget distribution bundle is less than 100 kB
11. Secure utility for injecting markup into UI/string interpolation
12. CSS is scoped and doesn’t collide or overwrite parent app’s CSS
13. Ships with used CSS only (no CSS bloat)
14. Minimal customization through run-time customization (basic colors), and deeper customization through build-time “theming” configuration
15. Special directories for custom callback handlers and stage handlers
16. Scores 90+ on Performance, Accessibility, and Best Practices with Lighthouse
17. TDD supported with unit, integration, UI component and E2E tests (according to this standard)
18. Automated type checking, linting, formatting
19. Storybook to develop UI components for documentation, and integration testing
20. Monitor bundle size, ship modern bundle, if we need to support older browsers, support those in their own bundle

### Engineering principles

1. Functional Programming principles strongly applied
   1. Data immutability
   2. Pure, stateless functions
   3. Referential transparency
2. Code execution is unidirectional
3. UI coupling is strongly discouraged and minimized
4. Clean separation between application responsibilities
   1. Global state (business logic)
   2. Component state (presentation logic)
   3. Asynchronous code (user events & network requests)
   4. UI rendering
   5. Routing (if applicable)
5. Following are of equal importance:
   1. Accessibility
   2. Performance
   3. Simplicity
   4. Testability
   5. Usability
6. Composability with independently usable layers
   1. Client
   2. Server/API
   3. Components
   4. Style

