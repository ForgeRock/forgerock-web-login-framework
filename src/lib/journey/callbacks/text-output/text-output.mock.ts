import type { CallbackType } from '@forgerock/javascript-sdk';

export const docsExample = {
  type: 'TextOutputCallback',
  output: [
    {
      name: 'message',
      value: 'Default message',
    },
    {
      name: 'messageType',
      value: '0',
    },
  ],
};

export default {
  authId: 'foo',
  "callbacks": [
    {
      "type": "TextOutputCallback",
      "output": [
        {
          "name": "message",
          "value": "Had coffee?"
        },
        {
          "name": "messageType",
          "value": "0"
        }
      ]
    },
    {
      "type": "ConfirmationCallback",
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
      "input": [
        {
          "name": "IDToken2",
          "value": 0
        }
      ]
    }
  ],
}
