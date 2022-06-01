export function getPasswordValidationFailureText(callback, label) {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  return failedPolicies.reduce((prev, curr) => {
    console.log(curr);
    let failureObj;
    try {
      failureObj = JSON.parse(curr);
    } catch (err) {
      console.log(`Parsing failure for ${label}`);
    }

    switch (failureObj.policyRequirement) {
      case 'LENGTH_BASED':
        prev = `${prev}Ensure password contains more than ${failureObj.params['min-password-length']} characters. `;
        break;
      case 'CHARACTER_SET':
        prev = `${prev}Ensure password contains 1 of each: capital letter, number and special character. `;
        break;
      default:
        prev = `${prev}Please check this value for correctness.`;
    }
    return prev;
  }, '');
};

export function getUsernameValidationFailureText(callback, label) {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  return failedPolicies.reduce((prev, curr) => {
    console.log(curr);
    let failureObj;
    try {
      failureObj = JSON.parse(curr);
    } catch (err) {
      console.log(`Parsing failure for ${label}`);
    }

    switch (failureObj.policyRequirement) {
      case 'VALID_USERNAME':
        prev = `${prev}Please choose a different username. `;
        break;
      case 'VALID_EMAIL_ADDRESS_FORMAT':
        prev = `${prev}Please use a valid email address. `;
        break;
      default:
        prev = `${prev}Please check this value for correctness.`;
    }
    return prev;
  }, '');
};

export function getStringAttributeValidationFailureText(callback, label) {
  // TODO: Mature this utility for more better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  return failedPolicies.reduce((prev, curr) => {
    console.log(curr);
    let failureObj;
    try {
      failureObj = JSON.parse(curr);
    } catch (err) {
      console.log(`Parsing failure for ${label}`);
    }

    switch (failureObj.policyRequirement) {
      default:
        prev = `${prev}Please check this value for correctness.`;
    }
    return prev;
  }, '');
};

export function isInputRequired(callback) {
  const policies = callback.getPolicies && callback.getPolicies();

  let isRequired = false;

  if (policies?.policyRequirements) {
    isRequired = policies.policyRequirements.includes('REQUIRED');
  } else if (callback.isRequired) {
    isRequired = callback.isRequired();
  }

  return isRequired;
};
