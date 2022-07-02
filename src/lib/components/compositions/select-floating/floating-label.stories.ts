import { screen, userEvent } from '@storybook/testing-library';

import Select from './floating-label.story.svelte';

export default {
  argTypes: {},
  component: Select,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Select: Floating',
};

export const Base = {
  args: {
    checkValidity: (e: Event) => {
      const el = e.target as HTMLSelectElement;
      return !!el.value
    },
    key: 'uniqueId',
    label: 'Select your option',
    onChange:  (e) => console.log(e.target.value),
    options: [
      { value: null, text: 'Choose Color' },
      { value: 0, text: 'Red' },
      { value: 1, text: 'Green' },
      { value: 2, text: 'Blue' },
    ],
  },
};

export const Error = {
  args: {
    ...Base.args,
    errorMessage: 'Please select an option',
    isRequired: true,
  },
};

const Template = (args) => ({
  Component: Select,
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

  const inputEl = screen.getByLabelText('Select your option', {
    selector: 'select',
  });
  await userEvent.selectOptions(inputEl, '1');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();
};
