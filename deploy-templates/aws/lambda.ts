/**
 * AWS Lambda entry for the Ping Identity Login App.
 *
 * This file IS the Lambda code — Alchemy bundles it (via `main: import.meta.filename`)
 * and pushes it as the function source. The default export is both the
 * infrastructure declaration AND the runtime handler.
 *
 * STATUS: SCAFFOLD pending the login app's refactor from SvelteKit + adapter-node
 * to a fully Effect-native HTTP server. Today this Lambda deploys and
 * responds with 501 to every request. When the refactor lands, replace
 * the catch-all `fetch` handler below with the real HttpRouter routes
 * (e.g. `/api/authenticate`, `/api/sessions`) and the template moves
 * from "scaffold" to "production-ready" without changes to alchemy.run.ts.
 *
 * The DynamoDB sessions binding is provisioned in alchemy.run.ts and
 * passed to this function via env. See `dynamoSessionStore` (pending
 * the session refactor) for the consumer side.
 */

import * as AWS from 'alchemy/AWS';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as HttpServerResponse from 'effect/unstable/http/HttpServerResponse';

export default class LoginAppFunction extends AWS.Lambda.Function<LoginAppFunction>()(
  'LoginApp',
  // Props as an Effect — Config.* yields run inside the deploy's Effect
  // context, so missing vars halt the deploy with a typed ConfigError
  // (converted to a defect via orDie below). FR_OAUTH_SCOPE is optional;
  // a missing value omits the env key rather than setting it empty.
  Effect.gen(function* () {
    const FR_OAUTH_SCOPE = yield* Config.option(Config.string('FR_OAUTH_SCOPE'));
    const required = {
      FR_AM_URL: yield* Config.string('FR_AM_URL'),
      FR_AM_COOKIE_NAME: yield* Config.string('FR_AM_COOKIE_NAME'),
      FR_OAUTH_PUBLIC_CLIENT: yield* Config.string('FR_OAUTH_PUBLIC_CLIENT'),
      FR_REALM_PATH: yield* Config.string('FR_REALM_PATH'),
    };
    const env = FR_OAUTH_SCOPE.pipe(
      Option.map((scope) => ({ ...required, FR_OAUTH_SCOPE: scope })),
      Option.getOrElse(() => required),
    );
    return {
      main: import.meta.filename,
      url: true,
      runtime: 'nodejs22.x' as const,
      env,
    };
  }).pipe(Effect.orDie),
  // Handler — returns 501 for everything until the Effect HTTP refactor
  // lands. The Function URL responding at all is the smoke test that the
  // bundle, IAM role, and runtime are wired correctly.
  Effect.succeed({
    fetch: HttpServerResponse.json(
        {
          error: 'NotImplemented',
          message:
            'API route pending Effect http-api refactor. See deploy-templates/aws/README.md.',
        },
        { status: 501 },
      ),
  }),
) {}
