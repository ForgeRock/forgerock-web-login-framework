<script>
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
  import Input from './input.svelte';
</script>

<Meta title="Primitives/Input" component={Input} />

<Template let:args>
  <Input {...args} />
</Template>

<Story
  name="UserNameInput"
  args={{
    fullWidth: true,
    label: 'Name',
    onChange: (event) => console.log(event.target.value),
    type: 'text',
    value: 'Jane Doe',
  }}
/>
