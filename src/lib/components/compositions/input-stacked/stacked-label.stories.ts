import { screen, userEvent } from '@storybook/testing-library';
// import { expect } from '@storybook/jest';

import Input from './stacked-label.story.svelte';

export default {
  argTypes: {
    key: { control: 'text' },
    label: { control: 'text' },
    type: { control: 'select', options: ['date', 'email', 'number', 'password', 'phone', 'text'] },
    value: { control: 'text' },
  },
  component: Input,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Input: Stacked',
};

export const Base = {
  args: {
    checkValidity: (e: Event) => {
      const el = e.target as HTMLInputElement;
      return !!el.value
    },
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    placeholder: 'E.g. my-username',
    value: '',
  },
};

export const Error = {
  args: {
    ...Base.args,
    errorMessage: 'This field must have a value.',
    isRequired: true,
  },
};

const Template = (args) => ({
  Component: Input,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Error.args, errorMessage: '', withForm: true };

Interaction.play = async () => {

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const submitButton = screen.getByText('Trigger Error');
  await userEvent.click(submitButton);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const inputEl = screen.getByLabelText('Username', {
    selector: 'input',
  });
  await userEvent.click(inputEl);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.type(inputEl, 'my-username', {
    delay: 200,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();
};
