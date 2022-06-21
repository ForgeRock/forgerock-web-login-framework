export function extractDomainFromUrl(url: string) {
  if (typeof url !== 'string') {
    throw new Error('AM_DOMAIN_PATH is not a string');
  }

  /**
   * Good old Stack Overflow answer: https://stackoverflow.com/a/25703406
   *
   * Regex 101 interactive demo: https://regex101.com/r/wN6cZ7/365
   */
  const arr = url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/);
  if (!Array.isArray(arr) && !arr[1]) {
    throw new Error('AM_DOMAIN_PATH is not a valid URL');
  }
  return arr[1];
}

interface RewriteCookieParams {
  cookie: string;
  amDomain: string;
  appDomain: string;
}

export function rewriteCookieForClient({ cookie, amDomain, appDomain }: RewriteCookieParams) {
  return cookie.replace(amDomain, appDomain);
}

export function rewriteCookieForServer({ cookie, amDomain, appDomain }: RewriteCookieParams) {
  return cookie.replace(appDomain, amDomain);
}
