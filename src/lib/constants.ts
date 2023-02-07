import { extractDomainFromUrl } from '$lib/server/_utilities';

const realmPath =
  import.meta.env.VITE_FR_REALM_PATH !== 'root'
    ? `realms/${import.meta.env.VITE_FR_REALM_PATH}`
    : '';

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  interface ImportMetaEnv {
    readonly VITE_FR_AM_URL: string;
    readonly VITE_FR_AM_COOKIE_NAME: string;
    readonly APP_DOMAIN: string;
  }
}

export const AM_COOKIE_NAME = import.meta.env.VITE_FR_AM_COOKIE_NAME;
export const AM_DOMAIN_PATH = import.meta.env.VITE_FR_AM_URL;
export const AM_DOMAIN = extractDomainFromUrl(import.meta.env.VITE_FR_AM_URL);
export const APP_DOMAIN = import.meta.env.APP_DOMAIN || 'localhost';
export const JSON_REALM_PATH = `/json/realms/root/${realmPath}`;
export const OAUTH_REALM_PATH = `/oauth2/realms/root/${realmPath}`;
