import { writable, type Writable } from 'svelte/store';
import { z } from 'zod';

export const logoSchema = z
  .object({
    dark: z.string().optional(),
    height: z.number().optional(),
    light: z.string().optional(),
    width: z.number().optional(),
  })
  .strict();

export const styleSchema = z
  .object({
    checksAndRadios: z.union([z.literal('animated'), z.literal('standard')]).optional(),
    labels: z.union([z.literal('floating').optional(), z.literal('stacked')]).optional(),
    logo: logoSchema.optional(),
    sections: z
      .object({
        header: z.boolean().optional(),
      })
      .strict()
      .optional(),
    stage: z
      .object({
        icon: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const partialStyleSchema = styleSchema.partial();

const fallbackStyles = {
  checksAndRadios: 'animated',
  labels: 'floating',
  logo: undefined,
  sections: undefined,
  stage: undefined,
} as const;

export const styleStore: Writable<z.infer<typeof partialStyleSchema>> = writable(fallbackStyles);

/**
 * @function initialize - Initialize the style store
 * @param {object} customStyle - An object of custom styles to merge with the default
 * @returns {object} - The style store
 * @example initialize({ checksAndRadios: 'standard' });
 */
export function initialize(customStyle?: z.infer<typeof partialStyleSchema>) {
  if (customStyle) {
    styleSchema.parse(customStyle);
    styleStore.set(customStyle);
  } else {
    styleStore.set(fallbackStyles);
  }
  return styleStore;
}
