import { jest, expect } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';
import Radio from './animated.story.svelte';

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
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Radio: Animated',
};

export const Base = {
  args: {
    key: 'uniqueId',
    name: 'color-selection',
    onChange: jest.fn(),
    options: [
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    value: false,
  },
};

export const LongLabel = {
  args: {
    key: 'uniqueId',
    name: 'color-selection',
    onChange: () => console.log('Checkbox value updated'),
    options: [
      { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit', value: 0 },
      {
        text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        value: 1,
      },
    ],
    value: false,
  },
};

const Template = (args) => ({
  Component: Radio,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Base.args };
Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const red = canvas.getByRole('radio', { name: 'Red' });
  const green = canvas.getByRole('radio', { name: 'Green' });
  const blue = canvas.getByRole('radio', { name: 'Blue' });

  await userEvent.tab();
  expect(red).toHaveFocus();
  expect(Base.args.onChange).not.toHaveBeenCalled();

  await userEvent.click(green);
  expect(green).toHaveFocus();
  expect(Base.args.onChange).toHaveBeenCalled();

  await userEvent.click(blue);
  expect(blue).toHaveFocus();
  expect(Base.args.onChange).toHaveBeenCalled();
};
