# Self-hosted Docker deployment

Deploy the Ping Identity Login App as a single Docker container against your
own infrastructure. Suitable for VMs, on-prem, single-host docker, or as a
starting point for `docker swarm` / `nomad` / k8s manifests you maintain.

This template intentionally does **not** use Alchemy — it's a plain
`docker-compose.yml` that consumes the multi-stage `Dockerfile` at the repo
root. Alchemy's value lives in the cloud templates (`../cloudflare/`,
`../aws/`); for self-hosted Docker, compose is the simpler, more portable
artifact.

## Prerequisites

- Docker 24+ and Docker Compose v2 (`docker compose ...`).
- An AM tenant (Identity Cloud or self-hosted). You'll need:
  - The AM base URL.
  - The AM session cookie name (default: `iPlanetDirectoryPro`).
  - A configured public OAuth 2.0 client.
  - The realm path your users authenticate against.

## Setup

```sh
cd deploy-templates/self-hosted-docker
cp .env.example .env
# edit .env with your AM tenant details
docker compose up --build
```

The container exposes the login app on `http://localhost:3000`. The healthcheck
hits `/api/locale` every 30s.

## Required environment variables

| Variable                 | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `FR_AM_URL`              | Full URL of your AM instance, e.g. `https://openam.example.com/am`.      |
| `FR_AM_COOKIE_NAME`      | The AM session cookie name.                                              |
| `FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 public client ID configured in AM.                             |
| `FR_REALM_PATH`          | Realm the login app authenticates against (`alpha`, `bravo`, or `root`). |
| `COOKIE_SECRET`          | At least 32 chars; HMAC key for the browser-facing session cookie.       |

Optional:

| Variable         | Purpose                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| `FR_OAUTH_SCOPE` | Override the OAuth scopes requested. Default: client's configured defaults. |
| `APP_DOMAIN`     | Public hostname clients reach the login app on. Defaults to `localhost`.    |

## Running multiple replicas

The current login app holds session state in process memory (`Map`). **Running
multiple replicas without sticky sessions will silently lose sessions**
when requests land on a different replica than the one that issued the
session UUID.

Until session storage is externalized:

- Run a single replica behind your load balancer, **or**
- Configure sticky sessions on your load balancer (cookie-based affinity
  on the `__Host-Sid` cookie or whichever name `COOKIE_SECRET` signs).

Multi-replica without external session storage is tracked as future work.
The Cloudflare and AWS templates will make this seamless once the session
work lands.

## Operations

| Task          | Command                             |
| ------------- | ----------------------------------- |
| Build + start | `docker compose up --build`         |
| Background    | `docker compose up -d --build`      |
| Logs          | `docker compose logs -f login-app`  |
| Stop          | `docker compose down`               |
| Rebuild only  | `docker compose build`              |
| Health        | `docker compose ps` (status column) |

## Going from this template to production

This template is the **starting point**, not the finished artifact. For a
production deployment you almost certainly want to:

1. Push the built image to your private registry instead of building on
   the host every deploy.
2. Replace `docker compose` with whatever orchestrator you use (k8s,
   ECS, Nomad, Cloud Run, App Service, etc.) — the image is portable.
3. Terminate TLS at a load balancer / ingress in front of the container.
   The login app expects `Secure` cookies and runs on plain HTTP internally.
4. Externalize logs and metrics (e.g. ship stdout to your log aggregator,
   add a `/metrics` endpoint if you want Prometheus scraping).
5. Move secrets out of `.env` and into your secret manager. Inject at
   container start via your orchestrator's secret integration.
