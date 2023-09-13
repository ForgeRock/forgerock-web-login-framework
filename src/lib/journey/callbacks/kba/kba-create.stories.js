import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

import response from './kba-create.mock';
import Input from './kba-create.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/KbaCreate',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.KbaCreateCallback),
  },
};

const Template = (args) => ({
  Component: Input,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const cb = step.getCallbackOfType(CallbackType.KbaCreateCallback);

  await userEvent.tab();

  const selectEl = canvas.getByLabelText('Select a security question', {
    selector: 'select',
  });
  await userEvent.selectOptions(selectEl, '0', { delay: 100 });

  await expect(canvas.queryByLabelText('Custom security question')).toBeNull();

  await userEvent.tab();

  const answerEl = canvas.getByLabelText('Security answer', {
    selector: 'input',
  });

  await userEvent.type(answerEl, 'Red', {
    delay: 200,
  });

  await userEvent.selectOptions(selectEl, '2', { delay: 100 });

  await userEvent.tab();

  await expect(canvas.queryByLabelText('Custom security question')).toBeVisible();

  const questionEl = canvas.getByLabelText('Custom security question', {
    selector: 'input',
  });

  await userEvent.type(questionEl, 'Favorite food?', {
    delay: 200,
  });

  await userEvent.clear(answerEl);
  await userEvent.type(answerEl, 'Tacos', {
    delay: 200,
  });

  await userEvent.selectOptions(selectEl, '1', { delay: 100 });

  expect(cb.getInputValue()).toBe('1');
  expect(cb.payload.input[1].value).toBe('Tacos');

  await expect(canvas.queryByLabelText('Custom security question')).toBeNull();

  await userEvent.clear(answerEl);
};
