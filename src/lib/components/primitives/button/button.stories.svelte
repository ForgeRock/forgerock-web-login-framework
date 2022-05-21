<script lang="ts">
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
  import Button from './button.svelte';
</script>

<Meta title="Primitives/Button" component={Button} />

<Template let:args>
  <Button {...args}>Submit</Button>
</Template>

<Story
  name="FullWidthButton"
  args={{
    fullWidth: true,
    onClick: (event) => console.log(event.target),
    style: 'primary',
  }}
/>
