/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { TokenId } from '$server/schemas';

export type RedirectData = {
  tokenId: TokenId;
  journeyStepUrl: string;
  isGotoOnFail: boolean;
  gotoUrl: string;
  successUrl: string | null;
  roles: string[];
  realm: string | undefined;
  amOrigin: string;
};

export type RedirectParams = {
  goto?: string;
  gotoOnFail?: string;
};

export type RedirectFormValue = {
  loginResult: 'success' | 'failure';
  tokenId: TokenId;
  journeyStepUrl: string;
};

export type Resolver = (redirectContext: RedirectData) => string | null;
