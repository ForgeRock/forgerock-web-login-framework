/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const linksSchema = z
  .object({
    termsAndConditions: z.string(),
  })
  .strict();

export const partialLinksSchema = linksSchema.partial();
export const linksStore: Writable<z.infer<typeof partialLinksSchema> | undefined> = writable();

/**
 * @function initialize - Initialize the links store
 * @param {object} customLinks - An object of custom links to merge with the default
 * @returns {object} - The links store
 * @example initialize({ termsAndConditions: 'https://example.com/terms' });
 */
export function initialize(customLinks?: z.infer<typeof partialLinksSchema>) {
  // If customLinks is provided, provide feedback for object
  if (customLinks) {
    // Provide developer feedback for custom links
    linksSchema.parse(customLinks);
    linksStore.set(customLinks);
  } else {
    linksStore.set(undefined);
  }
  return linksStore;
}
