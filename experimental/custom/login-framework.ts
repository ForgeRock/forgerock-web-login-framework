/**
 * Public framework API for custom components.
 *
 * Import everything your custom stage or callback component needs from here
 * instead of reaching into internal framework aliases directly:
 *
 *   import { Stacked, interpolate, type CallbackMetadata } from '$login-framework';
 *
 * This file is the intentionally-curated public surface for custom components.
 * It will not expose internal implementation details that may change across
 * widget upgrades — only curated, documented exports live here.
 *
 * To request a new export, open a PR adding it to this file.
 */

// ─── Compositions ────────────────────────────────────────────────────────────

/** Vertically-stacked label + input. Use for text / password inputs. */
export { default as Stacked } from '$components/compositions/input-stacked/stacked-label.svelte';

/** Floating label + input. */
export { default as Floating } from '$components/compositions/input-floating/floating-label.svelte';

/** Animated checkbox (checked state animates). */
export { default as CheckboxAnimated } from '$components/compositions/checkbox/animated.svelte';

/** Standard (non-animated) checkbox. */
export { default as CheckboxStandard } from '$components/compositions/checkbox/standard.svelte';

/** Animated radio button. */
export { default as RadioAnimated } from '$components/compositions/radio/animated.svelte';

/** Standard (non-animated) radio button. */
export { default as RadioStandard } from '$components/compositions/radio/standard.svelte';

/** Select with a floating label. */
export { default as SelectFloating } from '$components/compositions/select-floating/floating-label.svelte';

/** Select with a stacked label. */
export { default as SelectStacked } from '$components/compositions/select-stacked/stacked-label.svelte';

// ─── Primitives ──────────────────────────────────────────────────────────────

/** Bare text input element. */
export { default as Input } from '$components/primitives/input/input.svelte';

/** Form label element. */
export { default as Label } from '$components/primitives/label/label.svelte';

/** Bare checkbox input. */
export { default as Checkbox } from '$components/primitives/checkbox/checkbox.svelte';

/** Bare radio input. */
export { default as Radio } from '$components/primitives/radio/radio.svelte';

/** Bare select (dropdown) element. */
export { default as Select } from '$components/primitives/select/select.svelte';

/** Inline dismissable alert banner (error, warning, info). */
export { default as Alert } from '$components/primitives/alert/alert.svelte';

/** Themed submit / action button. */
export { default as Button } from '$components/primitives/button/button.svelte';

/** Form wrapper that wires up submit handling and ARIA semantics. */
export { default as Form } from '$components/primitives/form/form.svelte';

/** Validation / helper message displayed below an input. */
export { default as InputMessage } from '$components/primitives/message/input-message.svelte';

/** Animated loading spinner. */
export { default as Spinner } from '$components/primitives/spinner/spinner.svelte';

/** Anchor / navigation link element. */
export { default as Link } from '$components/primitives/link/link.svelte';

/** Inline text / paragraph element. */
export { default as Text } from '$components/primitives/text/text.svelte';

/** CSS grid layout wrapper. */
export { default as Grid } from '$components/primitives/grid/grid.svelte';

/** Horizontally and vertically centred container. */
export { default as Centered } from '$components/primitives/box/centered.svelte';

// ─── Utilities & helpers ─────────────────────────────────────────────────────

/**
 * Locale-aware text component. Looks up a key in the active locale strings
 * and renders the translated value, falling back to the slot content.
 *
 * Usage: <T key="loginTitle">Sign In</T>
 */
export { default as T } from '$components/_utilities/locale-strings.svelte';

/**
 * Callback mapper — renders the correct callback component for each callback
 * in the current step. Use this inside custom stage components so you don't
 * have to handle individual callback types yourself.
 */
export { default as CallbackMapper } from '$journey/_utilities/callback-mapper.svelte';

// ─── Icons ───────────────────────────────────────────────────────────────────

export { default as AccountIcon } from '$components/icons/account-icon.svelte';
export { default as ActionIcon } from '$components/icons/action-icon.svelte';
export { default as AlertIcon } from '$components/icons/alert-icon.svelte';
export { default as ClipboardIcon } from '$components/icons/clipboard-icon.svelte';
export { default as EmailIcon } from '$components/icons/email-icon.svelte';
export { default as EyeIcon } from '$components/icons/eye-icon.svelte';
export { default as FingerprintIcon } from '$components/icons/fingerprint-icon.svelte';
export { default as HomeIcon } from '$components/icons/home-icon.svelte';
export { default as InfoIcon } from '$components/icons/info-icon.svelte';
export { default as KeyIcon } from '$components/icons/key-icon.svelte';
export { default as LeftArrowIcon } from '$components/icons/left-arrow-icon.svelte';
export { default as LockIcon } from '$components/icons/lock-icon.svelte';
export { default as MobileIcon } from '$components/icons/mobile-icon.svelte';
export { default as NewUserIcon } from '$components/icons/new-user-icon.svelte';
export { default as ShieldCheckIcon } from '$components/icons/shield-check-icon.svelte';
export { default as ShieldIcon } from '$components/icons/shield-icon.svelte';
export { default as VerifiedIcon } from '$components/icons/verified-icon.svelte';
export { default as WarningIcon } from '$components/icons/warning-icon.svelte';
export { default as XIcon } from '$components/icons/x-icon.svelte';

// ─── Runtime utilities ───────────────────────────────────────────────────────

/**
 * Looks up a translation key and returns the localised string, falling back
 * to `defaultValue` if the key is not found.
 *
 * Usage: interpolate('loginTitle', null, 'Sign In')
 */
export { interpolate } from '$core/_utilities/i18n.utilities';

/**
 * Converts a human-readable label string (e.g. "Enter your name") into an
 * i18n key suitable for `interpolate` (e.g. "enterYourName").
 */
export { textToKey } from '$core/_utilities/i18n.utilities';

/**
 * Converts an arbitrary string to a normalized camelCase key.
 * Useful for building input `name` / `id` attributes from AM-supplied labels.
 */
export { convertStringToKey } from '$journey/stages/_utilities/step.utilities';

/**
 * Scans anchor elements rendered inside a stage and wires their `href` clicks
 * through the widget's link-capture mechanism (modal-safe navigation).
 */
export { captureLinks } from '$journey/stages/_utilities/stage.utilities';

/** Svelte readable store that holds the current resolved widget style object. */
export { styleStore } from '$core/style.store';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  /** Per-callback positional metadata injected by the framework. */
  CallbackMetadata,
  /** Call this function to auto-submit the current step without a submit button. */
  SelfSubmitFunction,
  /** Metadata about the current journey step (authId, stage, header, description). */
  StepMetadata,
  /** Shape of the `form` prop passed to every stage component. */
  StageFormObject,
  /** Shape of the `journey` prop passed to every stage component. */
  StageJourneyObject,
} from '$journey/journey.interfaces';

/** A value that may be undefined — equivalent to `T | undefined`. */
export type { Maybe } from '$core/interfaces';

/**
 * The resolved widget style object — type of the value emitted by `styleStore`.
 * Use this as the type for an `export let style` prop instead of the verbose
 * `z.infer<typeof styleSchema>` pattern.
 *
 * Usage: export let style: StyleObject = {};
 */
export type { StyleObject } from '$core/style.store';

/** Base type for any AM callback. Use as the prop type when authoring a custom callback. */
export type { BaseCallback } from '@forgerock/journey-client/types';

/** A full journey step — the shape passed to a custom stage component as `step`. */
export type { JourneyStep } from '@forgerock/journey-client/types';

// ─── Storybook helpers ───────────────────────────────────────────────────────
// These are convenience wrappers for use inside `*.story.svelte` and `*.mock.ts`
// files. They are not part of the runtime API surface — production code should
// not depend on them.

/**
 * Builds a `JourneyStep` from a raw AM `Step` payload. Use inside `.mock.ts`
 * files to produce the `step` value passed to a custom callback or stage story.
 */
export { createJourneyStep } from '$journey/_utilities/step.mock';

/**
 * Builds the per-callback metadata array a stage component expects. Pair with
 * `initCheckValidation()` when constructing the metadata for a story.
 */
export { buildCallbackMetadata, buildStepMetadata } from '$journey/_utilities/metadata.utilities';

/**
 * Returns a no-op `checkValidation` function suitable for `buildCallbackMetadata`
 * inside Storybook (where there is no real journey to validate against).
 */
export { initCheckValidation } from '$journey/stages/_utilities/step.utilities';

/** Initialise the in-page links store. Call inside a story before rendering a stage. */
export { initialize as initializeLinks } from '$core/links.store';

/** Initialise the widget style store. Call inside a story before rendering a stage. */
export { initialize as initializeStyles } from '$core/style.store';
