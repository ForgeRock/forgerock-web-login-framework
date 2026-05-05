/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { redirect } from '@sveltejs/kit';

import { getLocale } from '$core/_utilities/i18n.utilities';
import {
  createRedirectContext,
  readAndClearRedirectCookie,
  storeRedirectParams,
} from '$server/redirect/redirect.effects';
import { resolveRedirect } from '$server/redirect/redirect.utilities';

import type { RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';

import type { PageServerLoad } from './$types';
import type { stringsSchema } from '$core/locale.store';

export const load: PageServerLoad = async (event: RequestEvent) => {
  const userLocale = event.request.headers.get('accept-language') || 'en-US';
  const locale = getLocale(userLocale, '/');
  const [country, lang] = locale.split('/');

  let localeContent: { default: z.infer<typeof stringsSchema> };

  try {
    localeContent = await import(`$locales/${country}/${lang}/index.json`);
  } catch (err) {
    console.error(`User locale content for ${userLocale} was not found.`);

    // TODO: Reevaluate use of JS versus JSON without breaking type generation for lib
    // eslint-disable-next-line
    // @ts-ignore
    localeContent = await import(`$locales/us/en/index.json`);
  }

  const redirectParams = storeRedirectParams(event);

  return {
    content: localeContent.default,
    redirectParams,
  };
};

export const actions = {
  default: async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const cookie = readAndClearRedirectCookie(event);
    const redirectContext = await createRedirectContext(formData, cookie);
    const url = resolveRedirect(redirectContext);
    redirect(303, url);
  },
};
