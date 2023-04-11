import type { RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { z } from 'zod';

import { getLocale } from '$lib/_utilities/i18n.utilities';

import type { stringsSchema } from '$lib/locale.store';

export const GET: RequestHandler = async (event: RequestEvent) => {
  const userLocale = event.request.headers.get('accept-language') || 'en-US';
  const locale = getLocale(userLocale, '/');
  const [country, lang] = locale.split('/');

  let localeContent: { default: z.infer<typeof stringsSchema> };

  try {
    localeContent = await import(`../../../locales/${country}/${lang}/index.json`);
  } catch (err) {
    console.error(`User locale content for ${userLocale} was not found.`);

    // TODO: Reevaluate use of JS versus JSON without breaking type generation for lib
    // eslint-disable-next-line
    // @ts-ignore
    localeContent = await import(`../../../locales/us/en/index.json`);
  }

  return new Response(JSON.stringify(localeContent.default));
};
