<script lang="ts">
  import { Meta, Template, Story } from '@storybook/addon-svelte-csf';

  import Button from '../primitives/button.svelte';
  import Dialog from './dialog.svelte';
  import Input from '../primitives/input.svelte';
  import KeyIcon from '../icons/key-icon.svelte';

  let dialog;

  function openDialog() {
    dialog.showModal();
  }
</script>

<Meta title="Compositions/Dialog" component={Dialog} />

<Template let:args>
  <Button type="primary" fullWidth={false} onClick={openDialog}>Open Dialog</Button>
  <Dialog {...args} bind:dialog>
    <div class="flex w-full justify-center">
      <KeyIcon classes="text-gray-light fill-current mb-4" size="72px" />
    </div>
    <h2 class="flex font-light justify-center mb-4 text-4xl text-gray">Sign In</h2>
    <Input key="username" label="Username" onChange={() => {}} type="text" />
    <Button fullWidth={true} onClick={() => dialog.close()} type="primary">Close Me</Button>
  </Dialog>
</Template>

<Story
  name="UsernameDialog"
  args={{}}
/>
