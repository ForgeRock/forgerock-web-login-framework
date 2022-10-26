import { userEvent, within } from '@storybook/testing-library';
import { expect, jest } from '@storybook/jest';

import Input from './floating-label.story.svelte';

export default {
  argTypes: {
    key: { control: 'text' },
    label: { control: 'text' },
    message: { control: 'text' },
    type: { control: 'select', options: ['date', 'email', 'number', 'password', 'phone', 'text'] },
    value: { control: 'text' },
  },
  component: Input,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Input: Floating',
};

export const Base = {
  args: {
    checkValidity: jest.fn((e) => {
      const el = e.target;
      return !!el.value;
    }),
    message: '',
    key: 'simpleInput',
    isRequired: false,
    label: 'Username',
    onChange: jest.fn((e) => console.log(e.target.value)),
    value: '',
  },
};

export const LongLabel = {
  args: {
    checkValidity: (e) => {
      const el = e.target;
      return !!el.value;
    },
    message: '',
    key: 'simpleInput',
    isRequired: false,
    label: 'This is a very long label for testing purposes',
    onChange: (e) => console.log(e.target.value),
    value: '',
  },
};

export const WithValue = {
  args: {
    checkValidity: (e) => {
      const el = e.target;
      return !!el.value;
    },
    message: '',
    key: 'simpleInput',
    isRequired: false,
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    value: 'demouser',
  },
};

export const Error = {
  args: {
    ...Base.args,
    message: 'This field must have a value.',
    isRequired: true,
  },
};

const Template = (args) => ({
  Component: Input,
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

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const inputEl = canvas.getByLabelText('Username', {
    selector: 'input',
  });
  await userEvent.click(inputEl);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.type(inputEl, 'my-username', {
    delay: 200,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();
  expect(Error.args.onChange).toHaveBeenCalled();
  expect(Error.args.checkValidity).toHaveBeenCalled();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.click(submitButton);
};
