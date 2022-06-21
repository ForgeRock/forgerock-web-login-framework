import { screen, userEvent } from '@storybook/testing-library';
// import { expect } from '@storybook/jest';

import Input from './floating-label.story.svelte';

export default {
  component: Input,
  title: 'Compositions/Input: Floating',
  argTypes: {
    key: { control: 'text' },
    label: { control: 'text' },
    type: { control: 'select', options: ['date', 'email', 'number', 'password', 'phone', 'text'] },
    value: { control: 'text' },
  },
};

export const Base = {
  args: {
    isRequired: false,
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    value: '',
  },
};

export const Error = {
  args: {
    errorMessage: 'This field must have a value.',
    isRequired: true,
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    value: '',
  },
}

const Template = (args) => ({
  Component: Input,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = Error.args;

Interaction.play = async () => {

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

  await userEvent.clear(inputEl);

  await userEvent.tab();
};
