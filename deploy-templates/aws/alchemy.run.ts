/**
 * Deploys the Ping Identity Login App to AWS Lambda + DynamoDB.
 *
 * This template is shaped for the planned refactor of the login app to a fully
 * Effect-native HTTP server. The Lambda (in `lambda.ts`) is a forward-
 * compatible scaffold today — it deploys and responds, but most routes
 * return 501 until handlers are migrated. The infrastructure (DynamoDB
 * Sessions, Function URL, IAM, env vars) is fully provisioned and final.
 *
 * Required env vars at deploy time:
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY  (or AWS_PROFILE / SSO)
 *
 * Required env vars passed through to the Lambda runtime (see lambda.ts):
 *   FR_AM_URL, FR_AM_COOKIE_NAME, FR_OAUTH_PUBLIC_CLIENT, FR_REALM_PATH
 *   FR_OAUTH_SCOPE   (optional)
 */

import * as Alchemy from 'alchemy';
import * as AWS from 'alchemy/AWS';
import * as Effect from 'effect/Effect';
import LoginAppFunction from './lambda.ts';

// DynamoDB table for session storage. Schema: pk = session UUID, value =
// AM cookie string, ttl attribute for automatic eviction. Unconsumed by
// the scaffold today; wired in once the session refactor lands and a
// `dynamoSessionStore` impl is published in the source tree.
export const Sessions = AWS.DynamoDB.Table('Sessions', {
  partitionKey: 'sid',
  attributes: { sid: 'S' },
  billingMode: 'PAY_PER_REQUEST',
  timeToLiveSpecification: { Enabled: true, AttributeName: 'ttl' },
});

export default Alchemy.Stack(
  'PingIdentityLoginApp',
  {
    providers: AWS.providers(),
    state: Alchemy.localState(),
  },
  Effect.gen(function* () {
    const sessions = yield* Sessions;
    const fn = yield* LoginAppFunction;

    // TODO: when the session refactor lands, attach the Sessions table to
    // the Lambda's IAM role and pass `SESSIONS_TABLE=sessions.tableName`
    // through to the Lambda env. The exact binding pattern depends on
    // how `dynamoSessionStore` consumes the table reference.

    return {
      url: fn.functionUrl,
      sessionsTable: sessions.tableName,
      lambdaArn: fn.functionArn,
    };
  }),
);
