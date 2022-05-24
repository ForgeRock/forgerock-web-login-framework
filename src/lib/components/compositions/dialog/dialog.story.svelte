<script lang="ts">
  import Button from '$components/primitives/button/button.svelte';
  import Dialog from './dialog.svelte';
  import Input from '$components/primitives/input/input.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';

  // TODO: Export controls for changing dialog context

  let dialogEl;

  function openDialog() {
    dialogEl.showModal();
  }
</script>

<Button style="primary" width="auto" onClick={openDialog}>Open Dialog</Button>
<Dialog bind:dialogEl>
  <div class="tw_flex w-full tw_justify-center">
    <KeyIcon classes="tw_text-gray-light tw_fill-current tw_mb-4" size="72px" />
  </div>
  <h2 class="tw_flex tw_font-light tw_justify-center tw_mb-4 tw_text-4xl tw_text-gray">Sign In</h2>
  <Input key="username" label="Username" onChange={() => {}} type="text" />
  <Button width="full" onClick={() => dialogEl.close()} style="primary">Close Me</Button>
</Dialog>
