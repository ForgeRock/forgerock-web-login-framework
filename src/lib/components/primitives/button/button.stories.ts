import Button from './button.svelte';

export default {
  component: Button,
  title: 'Primitives/Button',
  argTypes: {
    width: {
      options: ['auto', 'half', 'full'],
      control: { type: 'radio' }
    },
    style: {
      options: ['outline', 'primary', 'secondary'],
      control: { type: 'radio' }
    },
    type: {
      options: ['button', 'submit'],
      control: { type: 'radio' }
    }
  }
};

export const Simple = {
  args: {
    width: 'auto',
    style: 'primary',
    type: 'button'
  }
}
