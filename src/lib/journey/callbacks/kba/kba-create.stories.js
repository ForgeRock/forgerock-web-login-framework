import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

import response from './kba-create.mock';
import Input from './kba-create.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
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
    inputName: 'passwordCallback',
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

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const selectEl = canvas.getByLabelText('Select a security question', {
    selector: 'select',
  });
  await userEvent.selectOptions(selectEl, '0', { delay: 200 });

  await expect(canvas.queryByLabelText('Custom Security Question')).toBeNull();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const answerEl = canvas.getByLabelText('Security Answer', {
    selector: 'input',
  });

  await userEvent.type(answerEl, 'Red', {
    delay: 200,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.selectOptions(selectEl, '2', { delay: 200 });

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await expect(canvas.queryByLabelText('Custom Security Question')).toBeVisible();

  const questionEl = canvas.getByLabelText('Custom Security Question', {
    selector: 'input',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.type(questionEl, 'Favorite food?', {
    delay: 200,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.clear(answerEl);
  await userEvent.type(answerEl, 'Tacos', {
    delay: 200,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.selectOptions(selectEl, '1', { delay: 200 });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await expect(canvas.queryByLabelText('Custom Security Question')).toBeNull();

  await userEvent.clear(answerEl);
};
