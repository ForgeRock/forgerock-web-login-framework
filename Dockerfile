# =============================================================================
# Stage 1: deps — install all dependencies (cached by lockfile)
# =============================================================================
FROM node:22-slim AS deps

RUN corepack enable

WORKDIR /app

# Prevent Playwright from downloading browsers (not needed for the BFF)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/login-widget/package.json packages/login-widget/
COPY apps/login-app/package.json apps/login-app/
COPY e2e/package.json e2e/

RUN pnpm install --frozen-lockfile


# =============================================================================
# Stage 2: builder — build the application
# =============================================================================
FROM deps AS builder

# Source code (deps are already in node_modules from stage 1)
COPY core/ core/
COPY packages/login-widget/ packages/login-widget/
COPY apps/login-app/ apps/login-app/

# VITE_* vars are baked into the client bundle at build time
ARG VITE_FR_AM_URL
ARG VITE_FR_AM_COOKIE_NAME
ARG VITE_FR_OAUTH_PUBLIC_CLIENT
ARG VITE_FR_REALM_PATH

ENV PREVIEW=true
RUN pnpm run build


# =============================================================================
# Stage 3: runner — minimal production image
# =============================================================================
FROM deps AS runner

ENV NODE_ENV=production

# Prune dev dependencies in-place (reuses cached install from deps stage)
RUN pnpm prune --prod

# Build artifacts from builder
COPY --from=builder /app/apps/login-app/build/ apps/login-app/build/
COPY --from=builder /app/packages/login-widget/dist/ packages/login-widget/dist/

WORKDIR /app/apps/login-app

# Run as non-root (node user exists in node:22-slim)
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "build/index.js"]
