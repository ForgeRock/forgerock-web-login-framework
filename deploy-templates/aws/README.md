# AWS Lambda deployment (forward-compatible scaffold)

Deploys the Ping Identity Login App to AWS as a Lambda function with a
public Function URL, backed by a DynamoDB sessions table. Uses
[Alchemy](https://alchemy.run) (`2.0.0-beta.x`).

## Status: forward-compatible scaffold

This template would work if we use an effect http api server, but we can address this if we dont

- `GET /api/locale` returns a placeholder response (smoke test).
- All other routes return 501 with a "pending Effect HTTP refactor" message.

As the Effect HTTP refactor proceeds, real handlers replace the catch-all in
`lambda.ts`. **No changes to `alchemy.run.ts` are needed** — the deploy
infrastructure is final today.

### Why this shape, not container Lambda?

`alchemy-effect`'s AWS Lambda support bundles JS via rolldown — it does
not deploy pre-built container images. The current SvelteKit +
adapter-node Dockerfile we use elsewhere doesn't fit that mental model.
Rather than ship a Lambda template that doesn't deploy, we shape the
template around the future Effect-native server and use a placeholder
router today.

## Prerequisites

- An AWS account with permissions for: Lambda, IAM, DynamoDB, CloudWatch
  Logs.
- AWS credentials configured locally (`~/.aws/credentials`, `AWS_PROFILE`,
  SSO, or an IAM role on your CI runner).
- Node 20+ and pnpm.
- An AM tenant with a configured public OAuth 2.0 client (only
  used by routes once they're implemented; not needed for scaffold deploy).

## Setup

```sh
cd deploy-templates/aws
cp .env.example .env
# edit .env: AWS region, AM tenant details (the latter is unused by
# the scaffold but populated for forward compat)
pnpm install
pnpm run deploy
```

`alchemy deploy` will:

1. Bundle `lambda.ts` (rolldown) and push as the Lambda code.
2. Provision the IAM role + execution role for the Lambda.
3. Create a public Lambda Function URL.
4. Create the DynamoDB `Sessions` table with TTL.
5. Print the Function URL.

To verify: `curl <function-url>/api/locale` should return
`{"locale":"en-US"}`. Other routes return 501 by design until handlers
land.

To tear down: `pnpm run destroy`.

## What's still pending

| Item                                                                  | Lands with                            |
| --------------------------------------------------------------------- | ------------------------------------- |
| Real route handlers (`/api/authenticate`, `/api/sessions`, etc.)      | Effect HTTP refactor                  |
| Wire DynamoDB `Sessions` table into the Lambda env (`SESSIONS_TABLE`) | Session refactor                      |
| `dynamoSessionStore` implementation consuming the table               | Session refactor                      |
| IAM policy granting Lambda read/write on `Sessions`                   | Session refactor (to scope correctly) |

## Required environment variables

### Deploy-time

| Variable                                      | Purpose                                         |
| --------------------------------------------- | ----------------------------------------------- |
| `AWS_REGION`                                  | Region the Lambda + DynamoDB are created in.    |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Deploy credentials, or use `AWS_PROFILE` / SSO. |

### Runtime (passed through to the Lambda by `lambda.ts`)

| Variable                 | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `FR_AM_URL`              | Your AM base URL.                          |
| `FR_AM_COOKIE_NAME`      | The AM session cookie name.                |
| `FR_OAUTH_PUBLIC_CLIENT` | OAuth 2.0 public client ID.                |
| `FR_REALM_PATH`          | Realm the login app authenticates against. |
| `FR_OAUTH_SCOPE`         | Optional OAuth scopes.                     |

These are consumed by the Lambda code (today: ignored by the scaffold;
tomorrow: read by Effect handlers).

## Verifying without deploying

You can type-check the template locally without an AWS account:

```sh
cd deploy-templates/aws
pnpm install
pnpm exec tsc --noEmit
```

This catches obvious breakage when the login app changes or alchemy versions
bump.
