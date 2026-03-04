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

RUN pnpm install --frozen-lockfile

COPY . .

FROM builder AS deploy

WORKDIR /usr/src/app
ENV NODE_ENV=production
# PREVIEW enables adapter-node in svelte.config.js
ENV PREVIEW="true"

RUN ["pnpm", "run", "build"]

EXPOSE 3000
CMD ["node", "apps/login-app/build"]
