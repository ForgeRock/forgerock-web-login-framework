import type { AttributeInputCallback, PolicyRequirement, ValidatedCreateUsernameCallback, ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

export function getAttributeValidationFailureText(callback: AttributeInputCallback<boolean | number | string>, label: string): string {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  return failedPolicies.reduce((prev, curr) => {
    switch (curr.policyRequirement) {
      default:
        prev = `${prev}Please review this.`;
    }
    return prev;
  }, '');
};

interface StringDict<T> {
  [name: string]: T;
}

export function getInputTypeFromPolicies(policies: StringDict<unknown>): 'email' | 'text' {
  const reqs = policies?.policyRequirements;
  let hasEmailReq: boolean;
  if (Array.isArray(reqs)) {
    hasEmailReq = reqs.includes('VALID_EMAIL_ADDRESS_FORMAT');
  }

  return hasEmailReq ? 'email' : 'text';
}

export function getPasswordValidationFailureText(callback: ValidatedCreatePasswordCallback, label: string): string {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  const parsedPolicies = parseFailedPolicies(failedPolicies, label);
  return parsedPolicies.reduce((prev, curr) => {
    switch (curr.policyRequirement) {
      case 'LENGTH_BASED':
        prev = `${prev}Ensure password contains more than ${curr.params['min-password-length']} characters. `;
        break;
      case 'CHARACTER_SET':
        prev = `${prev}Ensure password contains 1 of each: capital letter, number and special character. `;
        break;
      default:
        prev = `${prev}Please check this value.`;
    }
    return prev;
  }, '');
};

export function getUsernameValidationFailureText(callback: ValidatedCreateUsernameCallback, label: string): string {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  const parsedPolicies = parseFailedPolicies(failedPolicies, label);
  return parsedPolicies.reduce((prev, curr) => {
    switch (curr.policyRequirement) {
      case 'VALID_USERNAME':
        prev = `${prev}Please choose a different username. `;
        break;
      case 'VALID_EMAIL_ADDRESS_FORMAT':
        prev = `${prev}Please use a valid email address. `;
        break;
      default:
        prev = `${prev}Please check this value.`;
    }
    return prev;
  }, '');
};

export function isInputRequired(callback): boolean {
  const policies = callback.getPolicies && callback.getPolicies();

  let isRequired = false;

  if (policies?.policyRequirements) {
    isRequired = policies.policyRequirements.includes('REQUIRED');
  } else if (callback.isRequired) {
    isRequired = callback.isRequired();
  }

  return isRequired;
};

export function parseFailedPolicies(policies: unknown[], label): PolicyRequirement[] {
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
