# Deployment templates

Customer-facing templates for deploying the Ping Identity Login App to a
chosen target. Each template is self-contained: clone this repo, `cd` into
the template directory, set environment variables, and deploy.

| Template                                       | Target                                          | Status                                       | IaC                            |
| ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------- | ------------------------------ |
| [`self-hosted-docker/`](./self-hosted-docker/) | Single Docker host (VM, on-prem, swarm starter) | ✅ Production-ready (single-replica)         | docker-compose                 |
| [`cloudflare/`](./cloudflare/)                 | Cloudflare Workers + KV                         | ⚠️ Skeleton (sessions broken until refactor) | [Alchemy](https://alchemy.run) |
| [`aws/`](./aws/)                               | AWS Lambda (container) + DynamoDB               | ⚠️ Skeleton (sessions broken until refactor) | [Alchemy](https://alchemy.run) |

## Why some templates are skeletons

The login app currently keeps session state in an in-process `Map`. That works
for single-replica Docker, but is fundamentally incompatible with V8
isolates (Cloudflare Workers) and unreliable on serverless function
runtimes (Lambda). The skeleton templates **deploy successfully** and
provision the storage primitives needed (KV namespace, DynamoDB table)
but the app code does not yet read or write to them.

When the login app's session storage is refactored to a swappable
`SessionStore` interface with provider-specific implementations
(`kvSessionStore`, `dynamoSessionStore`), the skeleton templates will
gain a small `hooks.server.ts` overlay that wires the right impl into
the login app on startup. At that point each template moves from "deploys"
to "production-ready" without further infra changes.

## Picking a template

| If you...                                                             | Use                                                                                                                                                   |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run your own VMs, on-prem, or want the lightest-weight starting point | `self-hosted-docker/`                                                                                                                                 |
| Want global edge deployment, free tier, no servers to manage          | `cloudflare/` (once unstuck)                                                                                                                          |
| Already operate on AWS and want it in your existing account           | `aws/` (once unstuck)                                                                                                                                 |
| Run your own Kubernetes cluster                                       | `self-hosted-docker/` Dockerfile + your own manifests; a dedicated `self-hosted-k8s/` template using `alchemy/Kubernetes` is a likely future addition |

## Conventions across templates

- Each template has a `README.md` with secrets walkthrough, an
  `.env.example` showing required environment variables, and a `.gitignore`
  to keep `.env` out of source control.
- Cloud templates pin `alchemy@2.0.0-beta.x` — Alchemy is in beta, expect
  breaking changes between minor versions. Templates declare exact
  versions in their `package.json`.
- Runtime AM configuration uses the same env var names everywhere
  (`FR_AM_URL`, `FR_AM_COOKIE_NAME`, `FR_OAUTH_PUBLIC_CLIENT`,
  `FR_REALM_PATH`, optional `FR_OAUTH_SCOPE`, `COOKIE_SECRET`). Set them
  via your provider's secret-injection mechanism.
- Templates target this repo's `apps/login-app` source tree. Customers
  who want to fork the app code can do so; templates use relative paths
  (`../../apps/login-app`) so a clone of this repo is the unit of
  deployment.

## Preview environments

The repo's `.github/workflows/preview.yml` contains draft jobs for
deploying these templates per-PR (Cloud Run for the internal team,
Cloudflare for genuinely dogfooding the customer template). The workflow
is currently `workflow_dispatch`-only — flip the triggers and remove the
`if: false` guards once you've configured the required secrets.
