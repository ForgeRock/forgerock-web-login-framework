import { Data, Either } from 'effect';

/**
 * A TypeScript identifier derived from an untrusted component name: only
 * [A-Za-z0-9], PascalCase word runs, never empty, never a leading digit.
 * The brand makes it unrepresentable to interpolate an unsanitized raw name
 * where a generated-code identifier is required; the only producer is
 * {@link parseComponentName}.
 */
export type ComponentIdentifier = string & { readonly _brand: 'ComponentIdentifier' };

/**
 * Typed failure of {@link parseComponentName}. Carries the raw input for
 * terminal messaging and remediation text describing a valid name. The tag
 * is distinct from errors.ts InvalidComponentNameError so Effect catchTag
 * matching stays unambiguous; generate.ts maps this into the CLI's existing
 * InvalidComponentNameError at the command boundary.
 */
export class ComponentNameParseError extends Data.TaggedError('ComponentNameParseError')<{
  readonly name: string;
  readonly remediation: string;
}> {}

/** Characters allowed to survive into the identifier. */
const NON_IDENTIFIER_RUN_PATTERN = /[^A-Za-z0-9]+/g;

/** Leading digits, stripped so the identifier starts with a letter. */
const LEADING_DIGITS_PATTERN = /^\d+/;

/** Control characters (U+0000-U+001F, U+007F), which cannot appear in file content or terminal output safely. */
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/g; // eslint-disable-line no-control-regex

/**
 * Converts an alphanumeric word run to PascalCase: first letter uppercased,
 * the rest preserved. Input has already been narrowed to [A-Za-z0-9] runs by
 * {@link parseComponentName}, so no other characters can reach this function.
 */
const pascalCaseRun = (run: string): string => `${run.charAt(0).toUpperCase()}${run.slice(1)}`;

/**
 * The single controlled assertion in this module. The string has been proven
 * by {@link parseComponentName} to be non-empty, alphanumeric, and free of a
 * leading digit, which is exactly the ComponentIdentifier invariant. Keeping
 * the assertion in one named function makes every other cast in the codebase
 * easy to audit against it.
 */
const toComponentIdentifier = (proven: string): ComponentIdentifier =>
  proven as ComponentIdentifier;

/**
 * Parses an untrusted component name into a branded identifier safe for
 * interpolation into generated TypeScript, Svelte, and JSDoc/HTML-comment
 * contexts. Parse, don't validate: the branded type, not a boolean check, is
 * the proof a caller may interpolate.
 *
 * Algorithm, deterministic:
 * 1. Split on every run of characters outside [A-Za-z0-9], which drops quotes,
 *    comment terminators, markup, spaces, hyphens, and control characters in
 *    one pass. (This doc deliberately avoids writing those sequences literally:
 *    a JSDoc terminator inside a JSDoc block ends the comment early, the same
 *    injection class this module exists to prevent.)
 * 2. PascalCase each remaining run and concatenate
 *    ("my-cool-stage" -> "My" + "Cool" + "Stage" -> "MyCoolStage").
 * 3. Strip leading digits so the result starts with a letter
 *    ("2FA Login" -> "2FA" + "Login" -> "2FALogin" -> "FALogin",
 *    "42cool" -> "42cool" -> "cool").
 * 4. Empty at any point => typed error carrying remediation text.
 *
 * Preserves the multi-word behavior the scaffold tests rely on:
 * "My Login Stage" -> "MyLoginStage", "my-login-stage" -> "MyLoginStage".
 *
 * Never throws: failures are values in the Either error channel, so a caller
 * cannot forget to handle the rejection case.
 */
export const parseComponentName = (
  raw: string,
): Either.Either<ComponentIdentifier, ComponentNameParseError> => {
  const identifier = raw
    .split(NON_IDENTIFIER_RUN_PATTERN)
    .map(pascalCaseRun)
    .join('')
    .replace(LEADING_DIGITS_PATTERN, '');

  if (identifier.length === 0) {
    return Either.left(
      new ComponentNameParseError({
        name: raw,
        remediation:
          'Use a name containing at least one letter, e.g. DefaultLogin or "My Login Stage". ' +
          'The generated identifier keeps only letters and digits, PascalCases each word, and starts with a letter.',
      }),
    );
  }

  return Either.right(toComponentIdentifier(identifier));
};

/**
 * Makes a raw component name safe for terminal output only: control
 * characters are rendered as visible unicode escapes, so a hostile name
 * cannot move the cursor or inject ANSI sequences into CLI or MCP text.
 * The result is display text; never interpolate it into generated file
 * content. Mirrors the idea of safeNameForOutput in
 * core/journey/_utilities/registry/registry.ts, owned locally because
 * tools/cli cannot depend on core/.
 */
export const safeNameForTerminal = (name: string): string =>
  name.replace(
    CONTROL_CHARACTER_PATTERN,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
