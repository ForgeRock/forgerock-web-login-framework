import Input from './input.story.svelte';
import { expect, jest } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';

export default {
  argTypes: {
    isRequired: {
      control: { type: 'boolean' },
    },
    label: {
      control: { type: 'text' },
    },
    value: {
      control: { type: 'text' },
    },
  },
  component: Input,

  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Input',
};

export const LabelFirst = {
  args: {
    key: 'uniqueId',
    label: 'Username',
    placeholder: 'E.g.: my-username',
    onChange: jest.fn(() => console.log('Checkbox value updated')),
  },
};

export const LabelLast = {
  args: {
    key: 'uniqueId',
    label: 'Username',
    labelOrder: 'last',
    placeholder: 'E.g.: my-username',
    onChange: () => console.log('Checkbox value updated'),
  },
};

const Template = (args) => ({
  Component: Input,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...LabelFirst.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.tab();

  await userEvent.type(canvas.getByLabelText('Username'), 'input here');

  await new Promise((res) => setTimeout(res, 1000));

  await userEvent.tab();

  await expect(LabelFirst.args.onChange).toHaveBeenCalled();
};
