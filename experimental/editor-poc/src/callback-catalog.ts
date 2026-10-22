// Mock AM journey payloads for the full AM callback catalog (IAM-12011 task 3).
//
// Each entry maps one AM callback type to the raw Step payload consumed by
// createDemoStep (see compiler.ts) — the payload passes through the REAL
// createJourneyStep -> createCallback factory -> CallbackMapper -> real callback
// component, so what renders in the preview is the genuine framework rendering
// path. _id values are sequential per step as AM would emit them.
//
// Generated from journey-client 2.1.1 callback classes + core/ callback
// components; adversarially verified against both (workflow-derived, 2026-10-09).
//
// Known exclusions:
// - ConsentMappingCallback: not in the @forgerock/sdk-types callbackType enum
//   (legacy type; the real createCallback factory has no branch for it either),
//   so it cannot round-trip the real machinery — it falls to the Unknown
//   renderer like the deliberately-unregistered type below.
// - NumberAttributeInputCallback: in the callbackType enum, but core/ has no
//   callback-mapper case or component for it, so it only ever renders the
//   Unknown fallback. Add it back once core/ gains a renderer.

export const callbackCatalog: Record<string, string> = {
  BooleanAttributeInputCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": false
      },
      {
        "name": "IDToken1validateOnly",
        "value": false
      }
    ],
    "output": [
      {
        "name": "name",
        "value": "preferences/updates"
      },
      {
        "name": "prompt",
        "value": "Send me news and updates"
      },
      {
        "name": "required",
        "value": true
      },
      {
        "name": "policies",
        "value": {}
      },
      {
        "name": "failedPolicies",
        "value": []
      },
      {
        "name": "validateOnly",
        "value": false
      },
      {
        "name": "value",
        "value": false
      }
    ],
    "type": "BooleanAttributeInputCallback"
  }`,
  ChoiceCallback: `{
    "_id": 3,
    "input": [
      {
        "name": "IDToken1",
        "value": 0
      }
    ],
    "output": [
      {
        "name": "prompt",
        "value": "How would you like to receive your verification code?"
      },
      {
        "name": "choices",
        "value": [
          "Text message",
          "Email",
          "Voice call"
        ]
      },
      {
        "name": "defaultChoice",
        "value": 0
      }
    ],
    "type": "ChoiceCallback"
  }`,
  ConfirmationCallback: `{
    "_id": 4,
    "input": [
      {
        "name": "IDToken1",
        "value": 0
      }
    ],
    "output": [
      {
        "name": "prompt",
        "value": ""
      },
      {
        "name": "messageType",
        "value": 0
      },
      {
        "name": "options",
        "value": [
          "Yes",
          "No"
        ]
      },
      {
        "name": "optionType",
        "value": -1
      },
      {
        "name": "defaultOption",
        "value": 1
      }
    ],
    "type": "ConfirmationCallback"
  }`,
  DeviceProfileCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "metadata",
        "value": true
      },
      {
        "name": "location",
        "value": true
      },
      {
        "name": "message",
        "value": ""
      }
    ],
    "type": "DeviceProfileCallback"
  }`,
  HiddenValueCallback: `{
    "_id": 2,
    "input": [
      {
        "name": "IDToken2",
        "value": "webAuthnOutcome"
      }
    ],
    "output": [
      {
        "name": "value",
        "value": "false"
      },
      {
        "name": "id",
        "value": "webAuthnOutcome"
      }
    ],
    "type": "HiddenValueCallback"
  }`,
  KbaCreateCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1question",
        "value": ""
      },
      {
        "name": "IDToken1answer",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "prompt",
        "value": "Select a security question"
      },
      {
        "name": "predefinedQuestions",
        "value": [
          "What's your favorite color?",
          "Who was your first employer?",
          "What was the name of your first school?"
        ]
      },
      {
        "name": "allowUserDefinedQuestions",
        "value": true
      }
    ],
    "type": "KbaCreateCallback"
  }`,
  MetadataCallback: `{
    "_id": 3,
    "output": [
      {
        "name": "data",
        "value": {
          "myParameter": "MyValue"
        }
      }
    ],
    "type": "MetadataCallback"
  }`,
  NameCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "prompt",
        "value": "User Name"
      }
    ],
    "type": "NameCallback"
  }`,
  PasswordCallback: `{
    "_id": 1,
    "input": [
      {
        "name": "IDToken2",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "prompt",
        "value": "Password"
      }
    ],
    "type": "PasswordCallback"
  }`,
  PingOneProtectEvaluationCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1signals",
        "value": ""
      },
      {
        "name": "IDToken1clientError",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "pauseBehavioralData",
        "value": true
      }
    ],
    "type": "PingOneProtectEvaluationCallback"
  }`,
  PingOneProtectInitializeCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1clientError",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "envId",
        "value": "02fb1243-189a-4bc7-9d6c-a919edf64471"
      },
      {
        "name": "consoleLogEnabled",
        "value": false
      },
      {
        "name": "deviceAttributesToIgnore",
        "value": [
          "useragent"
        ]
      },
      {
        "name": "customHost",
        "value": "https://device-mgmt.pingone.com"
      },
      {
        "name": "lazyMetadata",
        "value": false
      },
      {
        "name": "behavioralDataCollection",
        "value": true
      },
      {
        "name": "deviceKeyRsyncIntervals",
        "value": 14
      },
      {
        "name": "enableTrust",
        "value": false
      },
      {
        "name": "disableTags",
        "value": false
      },
      {
        "name": "disableHub",
        "value": false
      }
    ],
    "type": "PingOneProtectInitializeCallback"
  }`,
  PollingWaitCallback: `{
    "_id": 0,
    "output": [
      {
        "name": "waitTime",
        "value": "2000"
      },
      {
        "name": "message",
        "value": "Please wait while we process your request."
      }
    ],
    "type": "PollingWaitCallback"
  }`,
  ReCaptchaCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "recaptchaSiteKey",
        "value": "6LdpVHIqAAAAAKrOYvGpPKQvhUMGNQ_MXjZKhI71"
      },
      {
        "name": "captchaDivClass",
        "value": "g-recaptcha"
      },
      {
        "name": "reCaptchaV3",
        "value": false
      }
    ],
    "type": "ReCaptchaCallback"
  }`,
  ReCaptchaEnterpriseCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1token",
        "value": ""
      },
      {
        "name": "IDToken1action",
        "value": ""
      },
      {
        "name": "IDToken1clientError",
        "value": ""
      },
      {
        "name": "IDToken1payload",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "recaptchaSiteKey",
        "value": "6LfmNIosAAAAALm6fLnSRZJlSbRAJAsEFGLMWLxD"
      },
      {
        "name": "captchaApiUri",
        "value": "https://www.google.com/recaptcha/enterprise.js"
      },
      {
        "name": "captchaDivClass",
        "value": "g-recaptcha"
      }
    ],
    "type": "ReCaptchaEnterpriseCallback"
  }`,
  RedirectCallback: `{
    "_id": 0,
    "output": [
      {
        "name": "redirectUrl",
        "value": "https://appleid.apple.com/auth/authorize?nonce=sdlfdv19i2ao8l7flpk54y7a5j5xqwh&response_mode=form_post&response_mode=form_post&response_type=code&client_id=com.forgerock.ios.sdk.social.service&redirect_uri=https://openam-forgerrock-sdksteanant.forgeblocks.com/am/oauth2/alpha/client/form_post/apple-web&scope=name%20email&code_challenge=cMZ_K8MUmWjDC1DUq_tLfcZxQskk2AJP0wLzYrf7ksw&code_challenge_method=S256&state=ip0578isppr4fe3qeckv7hsyq6fuwz6"
      },
      {
        "name": "redirectMethod",
        "value": "GET"
      },
      {
        "name": "trackingCookie",
        "value": true
      }
    ],
    "type": "RedirectCallback"
  }`,
  SelectIdPCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "providers",
        "value": [
          {
            "provider": "facebook-web",
            "uiConfig": {
              "buttonClass": "fa-facebook-official",
              "buttonCustomStyle": "background-color: #3b5998;border-color: #3b5998; color: white;",
              "buttonCustomStyleHover": "background-color: #334b7d;border-color: #334b7d; color: white;",
              "buttonDisplayName": "Facebook",
              "buttonImage": "",
              "iconBackground": "#3b5998",
              "iconClass": "fa-facebook",
              "iconFontColor": "white"
            }
          },
          {
            "provider": "apple-web",
            "uiConfig": {
              "buttonClass": "",
              "buttonCustomStyle": "background-color: #000000; color: #ffffff; border-color: #000000;",
              "buttonCustomStyleHover": "background-color: #000000; color: #ffffff; border-color: #000000;",
              "buttonDisplayName": "Apple",
              "buttonImage": "images/apple-logo.png",
              "iconBackground": "#000000",
              "iconClass": "fa-apple",
              "iconFontColor": "white"
            }
          },
          {
            "provider": "google-web",
            "uiConfig": {
              "buttonClass": "",
              "buttonCustomStyle": "background-color: #fff; color: #757575; border-color: #ddd;",
              "buttonCustomStyleHover": "color: #6d6d6d; background-color: #eee; border-color: #ccc;",
              "buttonDisplayName": "Google",
              "buttonImage": "images/g-logo.png",
              "iconBackground": "#4184f3",
              "iconClass": "fa-google",
              "iconFontColor": "white"
            }
          },
          {
            "provider": "linkedin-web",
            "uiConfig": {
              "buttonClass": "",
              "buttonCustomStyle": "background-color: #0077b5; color: white; border-color: #0077b5;",
              "buttonCustomStyleHover": "background-color: #006097; color: white; border-color: #006097;",
              "buttonDisplayName": "LinkedIn",
              "buttonImage": "",
              "iconBackground": "#0077b5",
              "iconClass": "",
              "iconFontColor": "white"
            }
          },
          {
            "provider": "microsoft-web",
            "uiConfig": {
              "buttonClass": "",
              "buttonCustomStyle": "background-color: #0072c6; color: white; border-color: #0072c6;",
              "buttonCustomStyleHover": "background-color: #005a9e; color: white; border-color: #005a9e;",
              "buttonDisplayName": "Microsoft",
              "buttonImage": "",
              "iconBackground": "#0072c6",
              "iconClass": "",
              "iconFontColor": "white"
            }
          }
        ]
      },
      {
        "name": "value",
        "value": ""
      }
    ],
    "type": "SelectIdPCallback"
  }`,
  StringAttributeInputCallback: `{
    "_id": 2,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      },
      {
        "name": "IDToken1validateOnly",
        "value": false
      }
    ],
    "output": [
      {
        "name": "name",
        "value": "givenName"
      },
      {
        "name": "prompt",
        "value": "First Name"
      },
      {
        "name": "required",
        "value": true
      },
      {
        "name": "policies",
        "value": {
          "conditionalPolicies": null,
          "fallbackPolicies": null,
          "name": "givenName",
          "policies": [
            {
              "policyId": "required",
              "policyRequirements": [
                "REQUIRED"
              ]
            },
            {
              "params": {
                "types": [
                  "string"
                ]
              },
              "policyId": "valid-type",
              "policyRequirements": [
                "VALID_TYPE"
              ]
            }
          ],
          "policyRequirements": [
            "REQUIRED",
            "VALID_TYPE"
          ]
        }
      },
      {
        "name": "failedPolicies",
        "value": []
      },
      {
        "name": "validateOnly",
        "value": false
      },
      {
        "name": "value",
        "value": ""
      }
    ],
    "type": "StringAttributeInputCallback"
  }`,
  SuspendedTextOutputCallback: `{
    "_id": 0,
    "output": [
      {
        "name": "message",
        "value": "An email has been sent to the address you entered. Click the link in that email to proceed."
      },
      {
        "name": "messageType",
        "value": "0"
      }
    ],
    "type": "SuspendedTextOutputCallback"
  }`,
  TermsAndConditionsCallback: `{
    "_id": 1,
    "input": [
      {
        "name": "IDToken1",
        "value": false
      }
    ],
    "output": [
      {
        "name": "version",
        "value": "0.0"
      },
      {
        "name": "terms",
        "value": "By creating an account you agree to the Ping Identity Terms of Use and Privacy Policy, including the processing of your personal data as described therein. You may withdraw consent at any time by deleting your account; doing so may prevent access to services that require an active account."
      },
      {
        "name": "createDate",
        "value": "2019-10-28T04:20:11.320Z"
      }
    ],
    "type": "TermsAndConditionsCallback"
  }`,
  TextInputCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "prompt",
        "value": "Security answer"
      }
    ],
    "type": "TextInputCallback"
  }`,
  TextOutputCallback: `{
    "_id": 4,
    "output": [
      {
        "name": "message",
        "value": "Your password expires in 7 days. Update it from your account settings to avoid losing access."
      },
      {
        "name": "messageType",
        "value": "0"
      }
    ],
    "type": "TextOutputCallback"
  }`,
  ValidatedCreatePasswordCallback: `{
    "_id": 6,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      },
      {
        "name": "IDToken1validateOnly",
        "value": false
      }
    ],
    "output": [
      {
        "name": "echoOn",
        "value": false
      },
      {
        "name": "policies",
        "value": {
          "conditionalPolicies": null,
          "fallbackPolicies": null,
          "name": "password",
          "policies": [
            {
              "params": {
                "types": [
                  "string"
                ]
              },
              "policyId": "valid-type",
              "policyRequirements": [
                "VALID_TYPE"
              ]
            },
            {
              "params": {
                "minLength": 8
              },
              "policyId": "minimum-length",
              "policyRequirements": [
                "MIN_LENGTH"
              ]
            },
            {
              "params": {
                "numCaps": 1
              },
              "policyId": "at-least-X-capitals",
              "policyRequirements": [
                "AT_LEAST_X_CAPITAL_LETTERS"
              ]
            },
            {
              "params": {
                "numNums": 1
              },
              "policyId": "at-least-X-numbers",
              "policyRequirements": [
                "AT_LEAST_X_NUMBERS"
              ]
            },
            {
              "params": {
                "disallowedFields": [
                  "userName",
                  "givenName",
                  "sn"
                ]
              },
              "policyId": "cannot-contain-others",
              "policyRequirements": [
                "CANNOT_CONTAIN_OTHERS"
              ]
            }
          ],
          "policyRequirements": [
            "VALID_TYPE",
            "MIN_LENGTH",
            "AT_LEAST_X_CAPITAL_LETTERS",
            "AT_LEAST_X_NUMBERS",
            "CANNOT_CONTAIN_OTHERS"
          ]
        }
      },
      {
        "name": "failedPolicies",
        "value": []
      },
      {
        "name": "validateOnly",
        "value": false
      },
      {
        "name": "prompt",
        "value": "Password"
      }
    ],
    "type": "ValidatedCreatePasswordCallback"
  }`,
  ValidatedCreateUsernameCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      },
      {
        "name": "IDToken1validateOnly",
        "value": false
      }
    ],
    "output": [
      {
        "name": "policies",
        "value": {
          "conditionalPolicies": null,
          "fallbackPolicies": null,
          "name": "userName",
          "policies": [
            {
              "policyId": "required",
              "policyRequirements": [
                "REQUIRED"
              ]
            },
            {
              "policyId": "not-empty",
              "policyRequirements": [
                "REQUIRED"
              ]
            },
            {
              "params": {
                "minLength": 1
              },
              "policyId": "minimum-length",
              "policyRequirements": [
                "MIN_LENGTH"
              ]
            },
            {
              "params": {
                "types": [
                  "string"
                ]
              },
              "policyId": "valid-type",
              "policyRequirements": [
                "VALID_TYPE"
              ]
            },
            {
              "policyId": "valid-username",
              "policyRequirements": [
                "VALID_USERNAME"
              ]
            },
            {
              "params": {
                "forbiddenChars": [
                  "/"
                ]
              },
              "policyId": "cannot-contain-characters",
              "policyRequirements": [
                "CANNOT_CONTAIN_CHARACTERS"
              ]
            },
            {
              "params": {
                "maxLength": 255
              },
              "policyId": "maximum-length",
              "policyRequirements": [
                "MAX_LENGTH"
              ]
            }
          ],
          "policyRequirements": [
            "REQUIRED",
            "MIN_LENGTH",
            "VALID_TYPE",
            "VALID_USERNAME",
            "CANNOT_CONTAIN_CHARACTERS",
            "MAX_LENGTH"
          ]
        }
      },
      {
        "name": "failedPolicies",
        "value": []
      },
      {
        "name": "validateOnly",
        "value": false
      },
      {
        "name": "prompt",
        "value": "Username"
      }
    ],
    "type": "ValidatedCreateUsernameCallback"
  }`,
  SomethingNotRegisteredCallback: `{
    "_id": 0,
    "input": [
      {
        "name": "IDToken1",
        "value": ""
      }
    ],
    "output": [
      {
        "name": "prompt",
        "value": "Verify your identity"
      }
    ],
    "type": "SomethingNotRegisteredCallback"
  }`,
};

export const CATALOG_TYPES: string[] = Object.keys(callbackCatalog);
