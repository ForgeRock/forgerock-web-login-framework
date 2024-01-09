import type {
  AttributeInputCallback,
  PolicyRequirement,
  ValidatedCreateUsernameCallback,
  ValidatedCreatePasswordCallback,
} from '@forgerock/javascript-sdk';

import { interpolate } from '$lib/_utilities/i18n.utilities';
import type { PolicyParams } from '@forgerock/javascript-sdk/src/auth/interfaces';

/** *********************************************
 * INTERFACES AND TYPES
 */
export interface Policy {
  message: string;
  policyId: string;
  policyRequirements: string[];
  params: Record<string, unknown>;
}
export interface FailedPolicy {
  params: Partial<PolicyParams> | undefined;
  policyRequirement: string;
  restructured: RestructuredParam[];
}

interface Policies {
  policies: unknown[];
  policyRequirements: string[];
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

/**
 * @function getInputTypeFromPolicies - Determines the type of input to use based on the policies object
 * @param {object} policies - The policies object from the callback
 * @returns {string} - The type of input to use
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

/**
 * @function getValidationFailureParams - Gets the validation failure params from the failed policy object
 * @param {object} failedPolicy - The failed policy object from the callback
 * @returns {array} - An array of objects containing the length, message, and rule
 */
export function getValidationFailureParams(
  failedPolicy: PolicyRequirement | undefined,
): RestructuredParam[] {
  if (failedPolicy?.policyRequirement === 'DICTIONARY') {
    const params = failedPolicy.params as {
      'case-sensitive-validation': boolean;
      'check-substrings': boolean;
      'min-substring-length': number;
      'test-reversed-password': boolean;
    };
    const min = params?.['min-substring-length'] || 0;

    const arr = [];

    if (params?.['check-substrings'] && params?.['test-reversed-password']) {
      arr.push({
        length: min,
        message: interpolate('passwordCannotContainCommonPasswordsOrBeReversibleStringsLessThan', {
          min: String(min),
        }),
        rule: 'reversibleSubstrings',
      });
    } else if (params?.['test-reversed-password']) {
      arr.push({
        length: null,
        message: interpolate('passwordCannotContainCommonPasswordsOrBeReversible'),
        rule: 'reversibleSubstrings',
      });
    } else {
      arr.push({
        length: null,
        message: interpolate('passwordCannotContainCommonPasswords'),
        rule: 'reversibleSubstrings',
      });
    }

    return arr;
  } else if (failedPolicy?.policyRequirement === 'CHARACTER_SET') {
    const params = failedPolicy.params as {
      'allow-unclassified-characters': boolean;
      'character-set-ranges': [];
      'character-sets': string[];
      'min-character-sets': number;
    };
    return params?.['character-sets'].map(convertCharacterSetToRuleObj);
  } else if (failedPolicy?.policyRequirement === 'LENGTH_BASED') {
    const params = failedPolicy.params as {
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
  } else if (failedPolicy?.policyRequirement === 'REPEATED_CHARACTERS') {
    const params = failedPolicy.params as {
      'case-sensitive-validation': boolean;
      'max-consecutive-length': number;
    };
    const max = params['max-consecutive-length'] || 0;

    const arr = [];

    if (!params['case-sensitive-validation']) {
      arr.push({
        length: max,
        message: interpolate('charactersCannotRepeatMoreThanCaseInsensitive', { max: String(max) }),
        rule: 'repeatedCharactersCaseInsensitive',
      });
    } else {
      arr.push({
        length: max,
        message: interpolate('charactersCannotRepeatMoreThan', { max: String(max) }),
        rule: 'repeatedCharacters',
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
  } else if (failedPolicy?.policyRequirement === 'VALID_EMAIL_ADDRESS_FORMAT') {
    return [
      {
        length: null,
        message: interpolate('invalidEmailAddress'),
        rule: 'validEmailAddress',
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

/**
 * @function getValidationMessageString - Gets the validation message string from the policy object
 * @param {object} policy - The policy object from the callback
 * @returns {string} - The validation message string
 */
function getValidationMessageString(policy: Policy) {
  switch (policy?.policyId) {
    case 'at-least-X-capitals': {
      const params = policy?.params as { numCaps: number };
      const length = params?.numCaps;
      return interpolate('minimumNumberOfUppercase', { num: String(length) });
    }
    case 'at-least-X-numbers': {
      const params = policy?.params as { numNums: number };
      const length = params?.numNums;
      return interpolate('minimumNumberOfNumbers', { num: String(length) });
    }
    case 'cannot-contain-characters': {
      const params = policy?.params as { forbiddenChars: string[] };
      let chars = '';

      if (typeof params !== 'object') {
        return '';
      }

      if (Array.isArray(params.forbiddenChars)) {
        chars = params.forbiddenChars.reduce((prev, curr) => {
          prev = `${prev ? `${prev}, ` : `${prev}`} ${curr}`;
          return prev;
        }, '');
      } else if (typeof params.forbiddenChars === 'string') {
        chars = params.forbiddenChars;
      }
      return interpolate('fieldCanNotContainFollowingCharacters', { chars });
    }
    case 'cannot-contain-others': {
      const params = policy?.params as { disallowedFields: string[] };
      let fields = '';

      if (typeof params !== 'object') {
        return '';
      }

      if (Array.isArray(params.disallowedFields)) {
        fields = params.disallowedFields?.reduce((prev, curr) => {
          prev = `${prev ? `${prev}, ` : `${prev}`} ${interpolate(curr)}`;
          return prev;
        }, '');
      } else if (typeof params.disallowedFields === 'string') {
        fields = params.disallowedFields;
      }
      return interpolate('fieldCanNotContainFollowingValues', { fields });
    }
    case 'maximum-length': {
      const params = policy?.params as { maxLength: number };
      const length = params?.maxLength;

      if (length > 100) {
        return '';
      }
      return interpolate('notToExceedMaximumCharacterLength', { max: String(length) });
    }
    case 'minimum-length': {
      const params = policy?.params as { minLength: number };
      const length = params?.minLength;

      if (length === 1) {
        return '';
      }
      return interpolate('noLessThanMinimumCharacterLength', { min: String(length) });
    }
    /**
     * The below cases can be handled, but I think they create more noise than value to the user
     */
    case 'not-empty':
      // return interpolate('fieldCanNotBeEmpty');
      return '';
    case 'required':
      // return interpolate('requiredField');
      return '';
    case 'valid-username':
      // return interpolate('chooseDifferentUsername');
      return '';
    case 'valid-email-address-format':
      // return interpolate('useValidEmail');
      return '';
    case 'valid-type':
      return '';
    default:
      return '';
  }
}

/**
 * @function getValidationFailures - Gets the validation failures from the callback object
 * @param {object} callback - The callback object from the server
 * @param {string} label - The label of the field
 * @returns {array} - An array of failed policies
 */
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

/**
 * @function getValidationPolicies - Gets the validation policies from the callback object
 * @param {object} policies - The policies object from the callback
 * @returns {array} - An array of policies
 */
export function getValidationPolicies(policies: StringDict<unknown>): Policy[] {
  if (typeof policies !== 'object' && !policies) {
    return [];
  }

  const reqs = policies?.policies;
  if (!Array.isArray(reqs)) {
    return [];
  }

  return reqs
    .map((policy) => {
      return {
        message: getValidationMessageString(policy),
        ...(policy?.params && { params: policy?.params }),
        ...(policy?.policyId && { policyId: policy?.policyId }),
      };
    })
    .filter((policy) => !!policy.message);
}

/**
 * @function isInputRequired - Checks if the input is required
 * @param {object} callback - The callback object from the server
 * @returns {boolean} - Whether the input is required
 */
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

/**
 * @function convertCharacterSetToRuleObj - Converts a character set to a rule object
 * @param {string} set - The character set to convert
 * @returns {object} - The rule object
 */
function convertCharacterSetToRuleObj(set: string) {
  const arr = set.split(':');
  const num = arr[0];
  const type = arr[1];

  if (type === '0123456789') {
    if (num === '0') {
      return {
        length: null,
        message: interpolate('shouldContainANumber'),
        rule: 'numbers',
      };
    } else {
      return {
        length: Number(num),
        message: interpolate('minimumNumberOfNumbers', { num: String(num) }),
        rule: 'numbers',
      };
    }
  } else if (type === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    if (num === '0') {
      return {
        length: null,
        message: interpolate('shouldContainAnUppercase'),
        rule: 'uppercase',
      };
    } else {
      return {
        length: Number(num),
        message: interpolate('minimumNumberOfUppercase', { num: String(num) }),
        rule: 'uppercase',
      };
    }
  } else if (type === 'abcdefghijklmnopqrstuvwxyz') {
    if (num === '0') {
      return {
        length: null,
        message: interpolate('shouldContainALowercase'),
        rule: 'lowercase',
      };
    } else {
      return {
        length: Number(num),
        message: interpolate('minimumNumberOfLowercase', { num: String(num) }),
        rule: 'lowercase',
      };
    }
  } else if (type.includes('@') || type.includes('!') || type.includes('*') || type.includes('#')) {
    if (num === '0') {
      return {
        length: null,
        message: interpolate('shouldContainASymbol'),
        rule: 'symbols',
      };
    } else {
      return {
        length: Number(num),
        message: interpolate('minimumNumberOfSymbols', { num: String(num) }),
        rule: 'symbols',
      };
    }
  } else {
    return {
      length: null,
      message: interpolate('pleaseCheckValue'),
      rule: 'unknown',
    };
  }
}

/**
 * @function parseFailedPolicies - Parses the failed policies from the callback object
 * @param {array} policies - The policies array from the callback
 * @param {string} label - The label of the field
 * @returns {array} - An array of failed policies
 */
export function parseFailedPolicies(
  policies: unknown[],
  label: string,
): (PolicyRequirement | undefined)[] {
  return policies.map((policy) => {
    if (typeof policy === 'string') {
      try {
        return JSON.parse(policy) as PolicyRequirement;
      } catch (err) {
        console.error(`Parsing failure for ${label}`);
      }
    } else {
      return policy as PolicyRequirement;
    }
  });
}

/**
 * @function getAttributeValidationFailureText - Gets the validation failure text from the callback object
 * @param {object} callback - The callback object from the server
 * @returns {string} - The validation failure text
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

/**
 * @function getPasswordValidationFailureText - Gets the validation failure text from the callback object
 * @param {object} callback - The callback object from the server
 * @param {string} label - The label of the field
 * @returns {string} - The validation failure text
 */
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

/**
 * @function getUsernameValidationFailureText - Gets the validation failure text from the callback object
 * @param {object} callback - The callback object from the server
 * @param {string} label - The label of the field
 * @returns {string} - The validation failure text
 */
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
