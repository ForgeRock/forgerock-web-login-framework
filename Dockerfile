# Overridable so builds work behind a firewall (saas passes a mirrored node base).
# Needs to stay debian-based, since the deploy stage uses groupadd/useradd and native deps.
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

FROM builder AS app-build

ENV NODE_ENV=production
# PREVIEW enables adapter-node in svelte.config.js
ENV PREVIEW="true"

RUN pnpm run build && \
    pnpm --filter @forgerock/login-app deploy --prod --legacy /runtime

FROM ${BASE_IMAGE} AS runtime-base

WORKDIR /app

# Package managers are only needed by the builder.
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-* /root/.cache/node/corepack && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/pnpm /usr/local/bin/pnpx /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    groupadd --gid 11111 app && \
    useradd --uid 11111 --gid 11111 --no-create-home app

# Keep the cleaned Debian runtime intact without inheriting package-manager layers.
FROM scratch AS deploy
# hadolint ignore=DL3067
COPY --from=runtime-base / /

WORKDIR /app
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV NODE_ENV=production
ENV PREVIEW="true"
ENTRYPOINT ["docker-entrypoint.sh"]

COPY --from=app-build --chown=11111:11111 /runtime/build ./apps/login-app/build
COPY --from=app-build --chown=11111:11111 /runtime/node_modules ./apps/login-app/node_modules
COPY --from=app-build --chown=11111:11111 /runtime/package.json ./apps/login-app/package.json
USER 11111:11111

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://localhost:3000/api/health/live').then(r => { if (!r.ok) throw 1 })"]

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
