import { CallbackType, FRCallback } from '@forgerock/javascript-sdk';
import { Config } from '@forgerock/javascript-sdk';
import { z } from 'zod';

const configSchema = z.object({
  callbackFactory: z
    .function()
    .args(
      z.object({
        _id: z.number().optional(),
        input: z
          .array(
            z.object({
              name: z.string(),
              value: z.unknown(),
            }),
          )
          .optional(),
        output: z.array(
          z.object({
            name: z.string(),
            value: z.unknown(),
          }),
        ),
        type: z.nativeEnum(CallbackType),
      }),
    )
    .returns(z.instanceof(FRCallback)).optional(),
  clientId: z.string().optional(),
  middleware: z.array(z.function()).optional(),
  realmPath: z.string(),
  redirectUri: z.string().optional(),
  scope: z.string().optional(),
  serverConfig: z.object({
    baseUrl: z.string(),
    paths: z.object({
      authenticate: z.string(),
      authorize: z.string(),
      accessToken: z.string(),
      endSession: z.string(),
      userInfo: z.string(),
      revoke: z.string(),
      sessions: z.string(),
    }).optional(),
    timeout: z.number(), // TODO: Should be optional; fix in SDK
  }),
  support: z.union([z.literal('legacy'), z.literal('modern')]).optional(),
  tokenStore: z
    .union([
      z.object({
        get: z.function().args(z.string()).returns(z.promise(z.object({
          accessToken: z.string(),
          idToken: z.string().optional(),
          refreshToken: z.string().optional(),
          tokenExpiry: z.number().optional(),
        }))),
        set: z.function().args(z.string()).returns(z.promise(z.void())),
        remove: z.function().args(z.string()).returns(z.promise(z.void())),
      }),
      z.literal('indexedDB'),
      z.literal('sessionStorage'),
      z.literal('localStorage'),
    ])
    .optional(),
  tree: z.string(),
  type: z.string().optional(),
  oauthThreshold: z.number().optional(),
});

// const defaultPaths = {
//   authenticate: 'authenticate',
//   authorize: 'authorize',
//   accessToken: 'tokens',
//   endSession: 'end-session',
//   userInfo: 'userinfo',
//   revoke: 'revoke',
//   sessions: 'sessions',
// };

export default function (config: z.infer<typeof configSchema>) {
  configSchema.parse(config);
  Config.set(config);
}
