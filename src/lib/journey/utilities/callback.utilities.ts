import type {
  AttributeInputCallback,
  PolicyRequirement,
  ValidatedCreateUsernameCallback,
  ValidatedCreatePasswordCallback,
} from '@forgerock/javascript-sdk';

import { interpolate } from '$lib/utilities/i18n.utilities';

type RequiredCallbacks =
  | AttributeInputCallback<boolean | string>
  | ValidatedCreatePasswordCallback
  | ValidatedCreateUsernameCallback;

export function convertStringToKey(string?: string | null): string {
  if (!string) {
    return '';
  }

  const replaceFunction = (_: string, char: string): string => `${char.toLowerCase()}`;
  const normalizedString = string
    .replace(/^([A-Z])/g, replaceFunction)
    .replace(/\s([a-z])/g, (_, char) => `${char.toUpperCase()}`);
  const key = normalizedString.replace(/\W/g, '');
  return key;
}

export function getAttributeValidationFailureText(
  callback: AttributeInputCallback<boolean | number | string>,
): string {
  // TODO: Mature this utility for better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  return failedPolicies.reduce((prev, curr) => {
    switch (curr.policyRequirement) {
      default:
        prev = `${prev}${interpolate('pleaseCheckValue')}`;
    }
    return prev;
  }, '');
}

interface StringDict<T> {
  [name: string]: T;
}

interface Policies {
  policyRequirements: string[];
}
export function getInputTypeFromPolicies(policies: StringDict<unknown>): 'email' | 'text' {
  const value = policies?.value as Policies;

  if (typeof value !== 'object') {
    return 'text';
  }

  const reqs = value?.policyRequirements;

  let hasEmailReq = false;
  if (Array.isArray(reqs)) {
    hasEmailReq = reqs.includes('VALID_EMAIL_ADDRESS_FORMAT');
  }

  return hasEmailReq ? 'email' : 'text';
}

export function getPasswordValidationFailureText(
  callback: ValidatedCreatePasswordCallback,
  label: string,
): string {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  const parsedPolicies = parseFailedPolicies(failedPolicies, label);
  return parsedPolicies.reduce((prev, curr) => {
    switch (curr?.policyRequirement) {
      case 'LENGTH_BASED':
        prev = `${prev}${interpolate('ensurePasswordIsMoreThan', {
          minPasswordLength: `${curr.params && curr.params['min-password-length']}`,
        })} `;
        break;
      case 'CHARACTER_SET':
        prev = `${prev}${interpolate('ensurePasswordHasOne')} `;
        break;
      default:
        prev = `${prev}${interpolate('pleaseCheckValue')} `;
    }
    return prev;
  }, '');
}

export function getUsernameValidationFailureText(
  callback: ValidatedCreateUsernameCallback,
  label: string,
): string {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  const parsedPolicies = parseFailedPolicies(failedPolicies, label);
  return parsedPolicies.reduce((prev, curr) => {
    switch (curr?.policyRequirement) {
      case 'MAX_LENGTH':
        prev = `${prev}`;
        break;
      case 'MIN_LENGTH':
        prev = `${prev}`;
        break;
      case 'REQUIRED':
        prev = `${prev}${interpolate('requiredField')}`;
        break;
      case 'VALID_USERNAME':
        prev = `${prev}${interpolate('chooseDifferentUsername')} `;
        break;
      case 'VALID_EMAIL_ADDRESS_FORMAT':
        prev = `${prev}${interpolate('useValidEmail')} `;
        break;
      default:
        prev = `${prev}${interpolate('pleaseCheckValue')}`;
    }
    return prev;
  }, '');
}

export function isInputRequired(callback: RequiredCallbacks): boolean {
  const policies = callback.getPolicies && callback.getPolicies();

  let isRequired = false;

  if (policies?.policyRequirements) {
    isRequired = policies.policyRequirements.includes('REQUIRED');
  } else if (callback.isRequired) {
    isRequired = callback.isRequired();
  }

  return isRequired;
}

export function parseFailedPolicies(
  policies: unknown[],
  label: string,
): (PolicyRequirement | undefined)[] {
  return policies.map((policy) => {
    if (typeof policy === 'string') {
      try {
        return JSON.parse(policy) as PolicyRequirement;
      } catch (err) {
        console.log(`Parsing failure for ${label}`);
      }
    } else {
      return policy as PolicyRequirement;
    }
  });
}
