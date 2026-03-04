/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/// <reference types="@sveltejs/kit" />
/// <reference types="vite/client" />

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare namespace App {
  // interface Locals {}
  // interface Platform {}
  // interface Session {}
  // interface Stuff {}
}

// Widget dist (types only generated during release build)
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '$package/index' {
  const Widget: any;
  export default Widget;
  export const configuration: any;
  export const component: any;
  export const journey: any;
  export const user: any;
  export const request: any;
  export const protect: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
declare module '$package/types' {
  export type UserStoreValue = {
    successful?: boolean;
    response?: unknown;
    error?: unknown;
  };
}

// Captcha + callback globals set on window by recaptcha/hcaptcha scripts
declare interface Window {
  hcaptcha?: {
    render: (id: string, opts: Record<string, unknown>) => unknown;
  };
  grecaptcha?: {
    render: (id: string, opts: Record<string, unknown>) => unknown;
  };
  frHandleCaptcha?: (token: string) => void;
  frHandleCaptchaError?: () => unknown;
  frHandleExpiredCallback?: () => void;
}

// qrcode module (no @types/qrcode available)
declare module 'qrcode' {
  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options: Record<string, unknown>,
    callback: (error: Error | null | undefined) => void,
  ): void;
}

// Extend Vite's ImportMetaEnv with custom env variables
declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_FR_AM_URL: string;
    readonly VITE_FR_AM_COOKIE_NAME: string;
    readonly APP_DOMAIN: string;
  }
}
