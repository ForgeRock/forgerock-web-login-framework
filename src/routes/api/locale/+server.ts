import type { RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getLocale } from '$lib/_utilities/i18n.utilities';

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
};

export const GET: RequestHandler = async (event: RequestEvent) => {
  const userLocale = event.request.headers.get('accept-language') || 'en-US';

  // TODO: Reworking typing here to index the locales object
  const locale = getLocale(userLocale, '_') as 'ca_en' | 'ca_fr' | 'us_en' | 'us_es';

  if (!locales[locale]) {
    return new Response(JSON.stringify(locales.us_en));
  }

  return new Response(JSON.stringify(locales[locale]));
}
