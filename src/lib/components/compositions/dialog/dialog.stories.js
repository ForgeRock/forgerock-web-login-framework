import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import Dialog from './dialog.story.svelte';

export default {
  component: Dialog,
  title: 'Compositions/Dialog',
};

export const DialogWithTrigger = {
  args: {},
};

const Template = (args) => ({
  Component: Dialog,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...DialogWithTrigger.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await expect(canvas.queryByText('Sign In')).not.toBeVisible();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const triggerButton = canvas.getByText('Open Dialog');
  await userEvent.click(triggerButton);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await expect(canvas.queryByText('Sign In')).toBeInTheDocument();

  const closeButton = canvas.getByTitle('Close Modal');
  await userEvent.click(closeButton);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await expect(canvas.queryByText('Sign In')).not.toBeVisible();

  await userEvent.click(triggerButton);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();
  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const submitButton = canvas.getByText('Submit');
  await userEvent.click(submitButton);

  await new Promise((resolve) => setTimeout(resolve, 2500));

  const inputEl = canvas.getByLabelText('Username', {
    selector: 'input',
  });
  await userEvent.type(inputEl, 'my-username', {
    delay: 200,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.click(submitButton);

  await expect(canvas.queryByText('Sign In')).not.toBeVisible();
};
