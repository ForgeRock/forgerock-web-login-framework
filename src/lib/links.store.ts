import { readable, type Readable } from 'svelte/store';
import { z } from 'zod';

export const linksSchema = z
  .object({
    termsAndConditions: z.string(),
  })
  .strict();

export const partialLinksSchema = linksSchema.partial();
export let links: Readable<z.infer<typeof partialLinksSchema> | undefined>;

export function initialize(customLinks?: z.infer<typeof partialLinksSchema>) {
  // If customLinks is provided, provide feedback for object
  if (customLinks) {
    // Provide developer feedback for custom links
    linksSchema.parse(customLinks);
    links = readable(customLinks);
  } else {
    links = readable();
  }
}
