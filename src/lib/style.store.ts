import { readable, type Readable } from 'svelte/store';
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
      .optional(),
    stage: z
      .object({
        icon: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();

export const partialStyleSchema = styleSchema.partial();
export let style: Readable<z.infer<typeof partialStyleSchema>>;

const fallbackStyle = {
  checksAndRadios: 'animated',
  labels: 'floating',
  logo: {},
  sections: {},
  stage: {},
} as const;

export function initialize(customStyle?: z.infer<typeof partialStyleSchema>) {
  if (customStyle) {
    styleSchema.parse(customStyle);
    style = readable(customStyle);
  } else {
    style = readable(fallbackStyle);
  }
}
