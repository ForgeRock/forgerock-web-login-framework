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
