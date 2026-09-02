/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { writable } from 'svelte/store';
import { z } from 'zod';

import type { Writable } from 'svelte/store';

const hexColorRegex = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

export const urlRegex =
  /^(https?:\/\/[^\s"'<>{}\\]+|data:image\/[a-zA-Z+]+;base64,[a-zA-Z0-9+/=]+)$/;

const fontFamilyRegex = /^[a-zA-Z0-9\s,'\-."]+$/;

const hexField = z.string().regex(hexColorRegex).optional().catch(undefined);

export const themeSchema = z
  .object({
    primaryColor: hexField,
    primaryOffColor: hexField,
    secondaryColor: hexField,
    backgroundColor: hexField,
    linkColor: hexField,
    linkActiveColor: hexField,
    logo: z.string().regex(urlRegex).optional().catch(undefined),
    favicon: z.string().regex(urlRegex).optional().catch(undefined),
    logoHeight: z.number().optional(),
    fontFamily: z.string().regex(fontFamilyRegex).optional().catch(undefined),
    buttonBorderRadius: z.number().optional(),
    cardBorderRadius: z.number().optional(),
    cardBgColor: hexField,
    inputBgColor: hexField,
    inputBorderColor: hexField,
    inputLabelColor: hexField,
    inputFocusRingColor: hexField,
    selectAccentColor: hexField,
    selectHoverBgColor: hexField,
    buttonFocusRingColor: hexField,
    inputTextColor: hexField,
    cardTextColor: hexField,
    bodyTextColor: hexField,
    buttonTextColor: hexField,
  })
  .strict();

export type ThemeObject = z.infer<typeof themeSchema>;

export const logoSchema = z
  .object({
    dark: z.string().optional(),
    height: z.number().optional(),
    light: z.string().optional(),
    width: z.number().optional(),
  })
  .strict();

export const textOutputStyleSchema = z
  .object({
    script: z.literal('hidden').optional(),
  })
  .strict();

export type TextOutputStyle = z.infer<typeof textOutputStyleSchema>;

export const styleSchema = z
  .object({
    callbacks: z
      .object({
        textOutput: textOutputStyleSchema.optional(),
      })
      .strict()
      .optional(),
    checksAndRadios: z.union([z.literal('animated'), z.literal('standard')]).optional(),
    labels: z.union([z.literal('floating').optional(), z.literal('stacked')]).optional(),
    showPassword: z
      .union([z.literal('none'), z.literal('button'), z.literal('checkbox')])
      .optional(),
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
    theme: themeSchema.optional(),
    themeCatalog: z.record(z.string(), themeSchema).optional(),
  })
  .strict();

export const partialStyleSchema = styleSchema.partial();

/** Convenience type alias for the resolved widget style object. */
export type StyleObject = z.infer<typeof partialStyleSchema>;

const fallbackStyles = {
  callbacks: undefined,
  checksAndRadios: 'animated',
  labels: 'floating',
  showPassword: 'button',
  logo: undefined,
  sections: undefined,
  stage: undefined,
  theme: undefined,
} as const;

export const styleStore: Writable<z.infer<typeof partialStyleSchema>> = writable(fallbackStyles);

/**
 * @function initialize - Initialize the style store
 * @param {object} customStyle - An object of custom styles to merge with the default
 * @returns {object} - The style store
 * @example initialize({ checksAndRadios: 'standard' });
 */
export function initialize(customStyle?: z.infer<typeof partialStyleSchema>) {
  const parsed = customStyle ? partialStyleSchema.safeParse(customStyle) : undefined;
  if (parsed?.success) {
    /*
      Helper function to safely assign keys to strict object
     */
    const accessStrictType = (str: keyof typeof parsed.data) => {
      return parsed.data[str];
    };
    const newStyleConfig = Object.keys(parsed.data).reduce((acc, key) => {
      if (
        accessStrictType(key as keyof typeof parsed.data) === undefined ||
        accessStrictType(key as keyof typeof parsed.data) === null
      ) {
        return acc;
      }
      return { ...acc, [key]: accessStrictType(key as keyof typeof parsed.data) };
    }, fallbackStyles);
    styleStore.set(newStyleConfig);
  } else {
    styleStore.set(fallbackStyles);
  }
  return styleStore;
}
