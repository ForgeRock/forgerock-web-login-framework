/**
 * Shared locale content loader.
 *
 * Resolves locale content from the Accept-Language header, falling back to
 * US English when the requested locale is not available.
 */
import type { z } from 'zod';
import { Effect, identity, pipe } from 'effect';

import { getLocale } from '$core/_utilities/i18n.utilities';
import type { stringsSchema } from '$core/locale.store';

type LocaleStrings = z.infer<typeof stringsSchema>;

interface LocaleModule {
  readonly default: LocaleStrings;
}

const FALLBACK_LOCALE = '$locales/us/en/index.json';

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * Check if an error is a module-not-found error (locale file doesn't exist).
 * Vite/Node dynamic imports throw with specific error codes when the module path
 * doesn't match any bundled file.
 */
const isModuleNotFound = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  const code = 'code' in err && typeof err.code === 'string' ? err.code : undefined;
  if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') return true;
  // Vite dev server uses "Failed to load url" or "Unknown variable dynamic import"
  if (err.message.includes('Unknown variable dynamic import')) return true;
  if (err.message.includes('Failed to load url')) return true;
  return false;
};

/** Load locale content for the given Accept-Language header, falling back to US English. */
export const loadLocaleContent = (acceptLanguage: string): Effect.Effect<LocaleStrings> => {
  const locale = getLocale(acceptLanguage, '/');
  const [country, lang] = locale.split('/');

  // The primary import MUST use a template literal directly (no @vite-ignore, no helper)
  // so Vite can statically analyze the glob pattern and bundle all locale files.
  return pipe(
    Effect.tryPromise({
      try: () => import(`$app-locales/${country}/${lang}/index.json`),
      catch: identity,
    }),
    Effect.map((mod: LocaleModule) => mod.default),
    Effect.catchAll((err) => {
      if (!isModuleNotFound(err)) {
        // System error (disk I/O, permission, OOM) — propagate as defect
        return pipe(
          Effect.logError(`System error loading locale "${country}/${lang}"`),
          Effect.annotateLogs({ error: errorMessage(err) }),
          Effect.andThen(
            Effect.die(new Error(`System error loading locale: ${errorMessage(err)}`)),
          ),
        );
      }

      // Locale file doesn't exist — fall back to en-US
      return pipe(
        Effect.logWarning(`Locale "${country}/${lang}" not available, falling back to en-US`),
        Effect.annotateLogs({ error: errorMessage(err) }),
        Effect.andThen(
          Effect.tryPromise({
            try: () => import(/* @vite-ignore */ FALLBACK_LOCALE),
            catch: identity,
          }),
        ),
        Effect.map((mod: LocaleModule) => mod.default),
      );
    }),
    Effect.catchAll((err) =>
      Effect.die(new Error(`Fallback locale (en-US) also failed: ${errorMessage(err)}`)),
    ),
  );
};
