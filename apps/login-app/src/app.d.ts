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

// Extend Vite's ImportMetaEnv with custom env variables
declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_FR_AM_URL: string;
    readonly VITE_FR_AM_COOKIE_NAME: string;
    readonly APP_DOMAIN: string;
  }
}
