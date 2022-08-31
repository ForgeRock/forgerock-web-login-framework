import type {
  AttributeInputCallback,
  PolicyRequirement,
  ValidatedCreateUsernameCallback,
  ValidatedCreatePasswordCallback,
} from '@forgerock/javascript-sdk';

import { interpolate } from '$lib/utilities/i18n.utilities';
import type { PolicyParams } from '@forgerock/javascript-sdk/lib/auth/interfaces';

/** *********************************************
 * INTERFACES AND TYPES
 */

interface FailedPolicy {
  params: Partial<PolicyParams> | undefined;
  policyRequirement: string;
  restructured: RestructuredParam[];
}
interface Policies {
  policies: unknown[];
  policyRequirements: string[];
}
interface Policy {
  message: string;
  policyId: string;
  policyRequirements: string[];
  params: Record<string, unknown>;
}
export interface RestructuredParam {
    length: number | null;
    message: string;
    rule: string;
}
interface StringDict<T> {
  [name: string]: T;
}

type ValidatedCallbacks =
  | AttributeInputCallback<boolean | string>
  | ValidatedCreatePasswordCallback
  | ValidatedCreateUsernameCallback;

/** *********************************************
 * NEW "NORMALIZED" METHODS
 */

export function getInputTypeFromPolicies(policies: StringDict<unknown>): 'email' | 'text' {
  const value = policies?.value as Policies;
  if (typeof value !== 'object') {
    return 'text';
  }

  const reqs = value?.policyRequirements;
  if (!Array.isArray(reqs)) {
    return 'text';
  }

  if (reqs.includes('VALID_EMAIL_ADDRESS_FORMAT')) {
    return 'email';
  }
  if (reqs.includes('VALID_USERNAME')) {
    return 'text';
  }

  return 'text';
}

export function getValidationFailureParams(failedPolicy: PolicyRequirement | undefined): RestructuredParam[] {
  if (failedPolicy?.policyRequirement === 'CHARACTER_SET') {
    const params = failedPolicy?.params as {
      'allow-unclassified-characters': boolean;
      'character-set-ranges': [];
      'character-sets': string[];
      'min-character-sets': number;
    };
    return params?.['character-sets'].map(convertCharacterSetToRuleObj);
  } else if (failedPolicy?.policyRequirement === 'LENGTH_BASED') {
    const params = failedPolicy?.params as {
      'max-password-length': number;
      'min-password-length': number;
    };
    const min = params?.['min-password-length'] || 0;
    const max = params?.['max-password-length'] || null;

    const arr = [];

    if (max) {
      arr.push({
        length: max,
        message: interpolate('exceedsMaximumCharacterLength', { max: String(max) }),
        rule: 'maximumLength',
      });
    }
    if (min) {
      arr.push({
        length: min,
        message: interpolate('doesNotMeetMinimumCharacterLength', { min: String(min) }),
        rule: 'minimumLength',
      });
    }
    return arr;
  } else if (failedPolicy?.policyRequirement === 'VALID_USERNAME') {
    return [
      {
        length: null,
        message: interpolate('chooseDifferentUsername'),
        rule: 'validUsername',
      },
    ];
  } else {
    return [
      {
        length: null,
        message: interpolate('pleaseCheckValue'),
        rule: 'unknown',
      },
    ];
  }
}

function getValidationMessageString(policy: Policy) {
  switch (policy?.policyId) {
    case 'at-least-X-capitals': {
      const params = policy?.params as { numCaps: number };
      const length = params?.numCaps;
      return interpolate('includeTheMinimumNumberOfCapitals', {length: String(length)});
    }
    case 'at-least-X-numbers': {
      const params = policy?.params as { numCaps: number };
      const length = params?.numCaps;
      return interpolate('includeTheMinimumNumberOfNumbers', {length: String(length)});
    }
    case 'cannot-contain-characters': {
      const params = policy?.params as { forbiddenChars: string[] };
      const chars = params?.forbiddenChars.reduce((prev, curr) => {
        prev = `${prev}, ${curr}`;
        return prev;
      }, '');
      return interpolate('fieldCanNotContainFollowingCharacters', {chars});
    }
    case 'cannot-contain-others': {
      const params = policy?.params as { disallowedFields: string[] };
      const fields = params?.disallowedFields?.reduce((prev, curr) => {
        prev = `${prev}, ${interpolate(curr)}`;
        return prev;
      }, '');
      return interpolate('fieldCanNotContainFollowingValues', {fields});
    }
    case 'maximum-length': {
      const params = policy?.params as { maxLength: number };
      const length = params?.maxLength;
      return interpolate('exceedsMaximumCharacterLength', {length: String(length)});
    }
    case 'minimum-length': {
      const params = policy?.params as { minLength: number };
      const length = params?.minLength;
      return interpolate('doesNotMeetMinimumCharacterLength', {length: String(length)});
    }
    case 'not-empty':
      return interpolate('fieldCanNotBeEmpty');
    case 'required':
      return interpolate('requiredField');
    case 'valid-username':
      return interpolate('chooseDifferentUsername');
    case 'valid-email-address-format':
      return interpolate('useValidEmail');
    case 'valid-type':
      return '';
    default:
      return interpolate('pleaseCheckValue');
  }
}

export function getValidationFailures(callback: ValidatedCallbacks, label: string): FailedPolicy[] {
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  const parsedPolicies = parseFailedPolicies(failedPolicies, label);

  return parsedPolicies.map((policy) => {
    return {
      params: policy?.params,
      policyRequirement: policy?.policyRequirement || '',
      restructured: getValidationFailureParams(policy),
    };
  });
}

export function getValidationPolicies(policies: StringDict<unknown>, label: string): Policy[] {
  const value = policies?.value as Policies;
  if (typeof value !== 'object') {
    return [];
  }

  const reqs = value?.policies;
  if (!Array.isArray(reqs)) {
    return [];
  }
  return reqs.map((policy) => {
    return {
      message: getValidationMessageString(policy),
      ...(policy?.params && { params: policy?.params }),
      ...(policy?.policyId && { policyId: policy?.policyId }),
    };
  });
}

export function isInputRequired(callback: ValidatedCallbacks): boolean {
  const policies = callback.getPolicies && callback.getPolicies();

  let isRequired = false;

  if (policies?.policyRequirements) {
    isRequired = policies.policyRequirements.includes('REQUIRED');
  } else if (callback.isRequired) {
    isRequired = callback.isRequired();
  }

  return isRequired;
}

function convertCharacterSetToRuleObj(set: string) {
  const arr = set.split(':');
  const num = arr[0];
  const type = arr[1];

  if (type === '0123456789') {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfNumbers', {num: String(num)}),
      rule: 'numbers',
    };
  } else if (type === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfUppercase', {num: String(num)}),
      rule: 'uppercase',
    };
  } else if (type === 'abcdefghijklmnopqrstuvwxyz') {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfLowercase', {num: String(num)}),
      rule: 'lowercase',
    };
  } else if (
    type.includes('@') ||
    type.includes('!') ||
    type.includes('*') ||
    type.includes('#')
  ) {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfSymbols', {num: String(num)}),
      rule: 'symbols',
    };
  } else {
    return {
      length: Number(num),
      message: interpolate('pleaseCheckValue'),
      rule: 'unknown',
    };
  }
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

/** *********************************************
 * OLD METHODS
 * @param string
 * @returns
 */

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
  // TODO: Mature this utility for better parsing and display
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
