import { describe, expect, it } from 'vitest';

import { parseFailedPolicies } from './callback.utilities';

describe('Test failed policies parser', () => {
  it('should convert serialized failed policy to PolicyRequirement obj', () => {
    const serializedPolicies = ['{ "policyRequirement": "VALID_EMAIL_ADDRESS_FORMAT" }'];
    const result = parseFailedPolicies(serializedPolicies, 'email');
    const expected = [{ policyRequirement: "VALID_EMAIL_ADDRESS_FORMAT" }];

    expect(result).toStrictEqual(expected);
  });

  it('should NOT convert a parsed policy', () => {
    const serializedPolicies = [{ policyRequirement: "VALID_EMAIL_ADDRESS_FORMAT" }];
    const result = parseFailedPolicies(serializedPolicies, 'email');
    const expected = [{ policyRequirement: "VALID_EMAIL_ADDRESS_FORMAT" }];

    expect(result).toStrictEqual(expected);
  });
});
