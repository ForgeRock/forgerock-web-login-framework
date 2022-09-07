<script lang="ts">
  /* eslint @typescript-eslint/no-empty-function: "off" */
  import Button from '$components/primitives/button/button.svelte';
  import Dialog from './dialog.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import KeyIcon from '$components/icons/key-icon.svelte';

  // TODO: Export controls for changing dialog context

  let dialogEl: HTMLDialogElement;

  function openDialog() {
    dialogEl.showModal();
  }

  function submitForm(event: SubmitEvent, isFormValid: boolean) {
    console.log('Form submitted');

    if (isFormValid) {
      dialogEl.close();
    }
  }
</script>

<Button style="primary" width="auto" onClick={openDialog}>Open Dialog</Button>
<Dialog bind:dialogEl closeCallback={(args) => {}} dialogId="myDialog">
  <div class="tw_flex w-full tw_justify-center">
    <KeyIcon classes="tw_text-gray-400 tw_fill-current tw_mb-4" size="72px" />
  </div>
  <h2
    class="tw_flex tw_font-light tw_justify-center tw_mb-4 tw_text-4xl tw_text-gray dark:tw_text-white"
  >
    Sign In
  </h2>
  <Form onSubmitWhenValid={submitForm}>
    <Input
      message="Please provide a value"
      isRequired={true}
      firstInvalidInput={false}
      key="username"
      label="Username"
      onChange={() => {}}
      type="text"
    />
    <Button onClick={() => {}} width="full" style="primary" type="submit">Submit</Button>
  </Form>
</Dialog>
