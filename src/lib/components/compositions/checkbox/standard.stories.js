import { expect, jest } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import Checkbox from './standard.story.svelte';

export default {
  argTypes: {
    label: {
      control: { type: 'text' },
    },
    key: {
      control: { type: 'text' },
    },
    value: {
      control: { type: 'boolean' },
    },
  },
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Checkbox: Standard',
};

export const Base = {
  args: {
    label: 'Check me!',
    key: 'uniqueId',
    onChange: jest.fn(() => console.log('Checkbox value updated')),
    value: false,
  },
};

export const Checked = {
  args: {
    label: 'Check me!',
    key: 'uniqueId',
    onChange: () => console.log('Checkbox value updated'),
    value: true,
  },
};

export const LongLabel = {
  args: {
    ...Base.args,
    label:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
};

export const Error = {
  args: {
    ...Base.args,
    checkValidity: jest.fn((event) => {
      const el = event.target;
      return el.checked;
    }),
    message: 'Please accept this',
    label: 'Check to accept this agreement',
  },
};

const Template = (args) => ({
  Component: Checkbox,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Error.args, errorMessage: '', withForm: true };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const submitButton = canvas.getByText('Trigger Error');
  await userEvent.click(submitButton);

  await expect(canvas.queryByText('Please accept this')).toBeVisible();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const inputEl = canvas.getByLabelText('Check to accept this agreement', {
    selector: 'input',
  });
  await userEvent.click(inputEl);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();
  await userEvent.click(submitButton);
  expect(Error.args.checkValidity).toHaveBeenCalled();
  expect(Error.args.onChange).toHaveBeenCalled();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await expect(canvas.queryByText('Please accept this')).not.toBeVisible();
};
