/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import '@hcaptcha/types';
import '@types/grecaptcha';

declare global {
  interface Window {
    frHandleCaptcha: (token: string) => void;
    frHandleExpiredCallback: () => void;
    FRHandleErrorCallback: () => void;
    frHandleCaptchaError: () => void;
  }
}
