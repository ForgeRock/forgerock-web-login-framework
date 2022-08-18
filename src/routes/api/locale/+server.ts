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
};

export async function GET(event: RequestEvent) {
  const userLocale = event.request.headers.get('accept-language') || 'en-US';

  // TODO: Reworking typing here to index the locales object
  const locale = getLocale(userLocale, '_') as 'ca_en' | 'ca_fr' | 'us_en' | 'us_es';

  throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
  // Suggestion (check for correctness before using):
  // return new Response(locales[locale]);
  return {
    body: locales[locale],
  };
}
