import type { RequestEvent } from '@sveltejs/kit';

import { getLocale } from '$lib/utilities/i18n.utilities';

// Supported locales
import ca_en from '$locales/ca/en/index.json';
import ca_fr from '$locales/ca/fr/index.json';
import us_en from '$locales/us/en/index.json';
import us_es from '$locales/us/es/index.json';

const locales = {
  ca_en,
  ca_fr,
  us_en,
  us_es,
}

export async function get(event: RequestEvent) {
  const userLocale = event.request.headers.get('accept-language') || 'en-US';

  const locale = getLocale(userLocale, '_');

  return {
    body: locales[locale],
  };
}

