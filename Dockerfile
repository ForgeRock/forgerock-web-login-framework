# BASE_IMAGE is overridable so the image can be built behind a firewall that
# blocks docker.io: the saas aic-login2 deploy script passes a reachable debian-slim
# node base (e.g. mirror.gcr.io/library/node:22-slim). Default is the upstream
# tag so CI and normal local builds are unchanged. Must remain debian-based —
# the deploy stage uses groupadd/useradd and @swc/core+esbuild native deps.
ARG BASE_IMAGE=node:22-slim
FROM ${BASE_IMAGE} AS builder

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

RUN corepack enable

WORKDIR /usr/src/app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy workspace configuration and all package.json files for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/login-widget/package.json packages/login-widget/
COPY apps/login-app/package.json apps/login-app/
COPY e2e/package.json e2e/
COPY themes/package.json themes/
COPY tools/cli/package.json tools/cli/

RUN pnpm install --frozen-lockfile

COPY . .

FROM builder AS deploy

WORKDIR /usr/src/app
ENV NODE_ENV=production
# PREVIEW enables adapter-node in svelte.config.js
ENV PREVIEW="true"

RUN ["pnpm", "run", "build"]

# Create forgerock user (UID 11111) to match saas Kubernetes security standards.
# The node base image provides UID 1000, but AIC workloads must run as 11111.
RUN groupadd --gid 11111 forgerock && \
    useradd --uid 11111 --gid 11111 --no-create-home --shell /bin/bash forgerock

# Only chown the build output — avoids duplicating the entire node_modules layer
RUN chown -R forgerock:forgerock apps/login-app/build
USER forgerock

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
