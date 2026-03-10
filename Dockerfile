FROM node:22-slim AS builder

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV
ARG VITE_FR_AM_URL
ARG VITE_FR_AM_COOKIE_NAME
ARG VITE_FR_OAUTH_PUBLIC_CLIENT
ARG VITE_FR_REALM_PATH

RUN corepack enable

WORKDIR /usr/src/app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy workspace configuration and all package.json files for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/login-widget/package.json packages/login-widget/
COPY apps/login-app/package.json apps/login-app/
COPY e2e/package.json e2e/
COPY themes/package.json themes/

RUN pnpm install --frozen-lockfile

COPY . .

FROM builder AS deploy

WORKDIR /usr/src/app
ENV NODE_ENV=production
# PREVIEW enables adapter-node in svelte.config.js
ENV PREVIEW="true"

RUN ["pnpm", "run", "build"]

# Run as the built-in non-root user from the node base image
# Only chown the build output — avoids duplicating the entire node_modules layer
RUN chown -R node:node apps/login-app/build
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/locale').then(r => { if (!r.ok) throw 1 })"

CMD ["node", "apps/login-app/build"]

# ── E2E test stage ──────────────────────────────────────────────────
# Official Playwright image has Chromium + system deps pre-installed.
# Image version must match the @playwright/test version in pnpm-lock.yaml.
# Run via: docker compose run --rm e2e
FROM mcr.microsoft.com/playwright:v1.58.2-noble AS e2e

# Install pnpm at build time so it's cached — no network needed at runtime
RUN corepack enable && corepack prepare pnpm@10.6.0 --activate
WORKDIR /usr/src/app

# Copy the fully installed workspace from builder (source + node_modules)
COPY --from=builder /usr/src/app /usr/src/app

CMD ["pnpm", "ci:e2e"]
