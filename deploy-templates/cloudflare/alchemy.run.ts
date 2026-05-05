/**
 * Deploys the Ping Identity Login App to Cloudflare Workers.
 *
 * STATUS: SKELETON — DEPLOYS BUT SESSIONS DO NOT WORK.
 *
 * The login app currently keeps session state in an in-process `Map`. V8 isolates
 * do not share memory across invocations, so on Workers every request
 * effectively starts with an empty session table and authentication state
 * is lost. The KVNamespace declared below is wired into the Worker's env as
 * `Sessions` and is ready for the future `kvSessionStore` impl. Until that
 * lands, Worker deploys are useful for verifying the build/bundle pipeline
 * but not for serving real traffic.
 *
 * See `../README.md` for the deployment walkthrough and the limitations
 * section for the full caveat list.
 *
 * Required env vars at deploy time:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN
 *
 * Required env vars at runtime (passed to the Worker via `env:` below):
 *   FR_AM_URL, FR_AM_COOKIE_NAME, FR_OAUTH_PUBLIC_CLIENT, FR_REALM_PATH
 *   COOKIE_SECRET                   (sensitive — Config.redacted)
 */

import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';

export const Sessions = Cloudflare.KVNamespace('Sessions');

export default Alchemy.Stack(
  'PingIdentityLoginApp',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    // Config.* fails the Effect with a typed ConfigError if any of these
    // are missing or empty. Config.redacted returns Redacted<string> so
    // the value stays opaque in logs and deploys as a Worker secret_text
    // binding. ConfigError gets converted to a defect by Effect.orDie
    // below — for a deploy script, missing config should halt fatally.
    const FR_AM_URL = yield* Config.string('FR_AM_URL');
    const FR_AM_COOKIE_NAME = yield* Config.string('FR_AM_COOKIE_NAME');
    const FR_OAUTH_PUBLIC_CLIENT = yield* Config.string('FR_OAUTH_PUBLIC_CLIENT');
    const FR_REALM_PATH = yield* Config.string('FR_REALM_PATH');
    const COOKIE_SECRET = yield* Config.redacted('COOKIE_SECRET');

    const worker = yield* Cloudflare.Vite('LoginApp', {
      rootDir: '../../apps/login-app',
      compatibility: {
        flags: ['nodejs_compat'],
      },
      bindings: {
        Sessions,
      },
      env: {
        FR_AM_URL,
        FR_AM_COOKIE_NAME,
        FR_OAUTH_PUBLIC_CLIENT,
        FR_REALM_PATH,
        COOKIE_SECRET,
      },
    });

    return {
      url: worker.url,
    };
  }).pipe(Effect.orDie),
);
