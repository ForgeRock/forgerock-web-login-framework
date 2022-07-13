import type { RequestEvent } from '@sveltejs/kit';

import { locale } from '$lib/locale.store';
import { getLocaleDir } from '$lib/utilities/i18n.utilities';

export async function get(event: RequestEvent) {
  const userLocale = event.request.headers.get('accept-language') || 'en-US';
  locale.set(userLocale);

  const localDir = getLocaleDir(userLocale);
  console.log(localDir);

  let content;

  try {
    content = await import(`../../../locales/${localDir}/index.json`);
  } catch (err) {
    throw new Error('Missing locale file');
  }

  return {
    body: content,
  };
}

