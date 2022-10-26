import { expect, jest } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';
import { action } from '@storybook/addon-actions';
import Select from './select.story.svelte';

export default {
  argTypes: {
    isRequired: {
      control: { type: 'boolean' },
    },
    label: {
      control: { type: 'text' },
    },
    key: {
      control: { type: 'text' },
    },
    value: {
      control: { type: 'text' },
    },
  },
  component: Select,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Select',
};

export const LabelFirst = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Favorite Color',
    onChange: jest.fn(),
    options: [
      { value: null, text: 'Choose Color' },
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    defaultOption: 0,
  },
};

export const LabelLast = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Favorite Color',
    labelOrder: 'last',
    onChange: jest.fn(),
    options: [
      { text: 'Choose Color', value: null },
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    defaultOption: null,
  },
};

const Template = (args) => ({
  Component: Select,
  props: args,
});

export const Interaction = Template.bind({})

Interaction.args = { ...LabelLast.args, label: 'Choose Color' };
Interaction.play = async ({ canvasElement }) => {

  const canvas = within(canvasElement);

  const label = canvas.getByLabelText('Choose Color');

  await userEvent.tab();

  expect(label).toHaveFocus()

  expect(LabelLast.args.onChange).not.toHaveBeenCalled();

  await userEvent.selectOptions(label, ['0'])
  expect(canvas.getByText('Red')).toHaveTextContent('Red')
  expect(LabelLast.args.onChange).toHaveBeenCalled();
  await userEvent.selectOptions(label, ['1'])
  expect(canvas.getByText('Green')).toHaveTextContent('Green')
  expect(LabelLast.args.onChange).toHaveBeenCalled();
  await userEvent.selectOptions(label, ['2'])
  expect(canvas.getByText('Blue')).toHaveTextContent('Blue')
}
