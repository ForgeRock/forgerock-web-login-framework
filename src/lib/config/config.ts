import { Config } from '@forgerock/javascript-sdk';

const defaultPaths = {
  authenticate: 'authenticate',
  authorize: 'authorize',
  accessToken: 'tokens',
  endSession: 'end-session',
  userInfo: 'userinfo',
  revoke: 'revoke',
  sessions: 'sessions',
};

export default function (config) {
  Config.set(config);
}
