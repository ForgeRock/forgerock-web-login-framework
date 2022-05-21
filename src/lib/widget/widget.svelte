<script context="module" lang="ts">
  let _dialog;
  export function closeModal() {
    _dialog.close();
  }
  export function showModal() {
    _dialog.showModal();
  }
  export function onSuccess(fn) {
    returnUser = (user) => fn(user);
  };
  export let returnUser;
</script>

<script lang="ts">
  import { Config } from '@forgerock/javascript-sdk';
  import { onMount } from 'svelte';

  import Dialog from '../components/compositions/dialog/dialog.svelte';
  import Form from '../journey/form.svelte';
  import KeyIcon from '../components/icons/key-icon.svelte';

  export let config;
  export let mounted;

  let dialog;

  onMount(() => {
    _dialog = dialog;
    mounted(dialog);
  });

  Config.set(config);
</script>

<Dialog bind:dialog>
  <div class="flex w-full justify-center">
    <KeyIcon classes="text-gray-light fill-current mb-4" size="72px" />
  </div>
  <h2 class="flex font-light justify-center mb-4 text-4xl text-gray">Sign In</h2>
  <Form {closeModal} {returnUser} />
</Dialog>
