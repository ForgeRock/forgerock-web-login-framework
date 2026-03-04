/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { PageServerLoad } from './$types';

import { Effect } from 'effect';

import { loadLocaleContent } from '$server/locale';
import { run } from '$server/run';

export const load: PageServerLoad = async (event) => {
  const acceptLanguage = event.request.headers.get('accept-language') || 'en-US';
  const content = await run(loadLocaleContent(acceptLanguage).pipe(Effect.orDie));
  return { content };
};
