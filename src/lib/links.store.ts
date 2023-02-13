import { readable, type Readable } from 'svelte/store';
import { z } from 'zod';

export const linksSchema = z
  .object({
    termsAndConditions: z.string(),
  })
  .strict();

export const partialLinksSchema = linksSchema.partial();
export let links: Readable<Record<string, string> | null>;

export function initialize(customLinks?: z.infer<typeof partialLinksSchema>) {
  // Provide developer feedback for custom links
  linksSchema.parse(customLinks);

  links = readable(customLinks);
}
