<script lang="ts">
  import {
    WebAuthnStepType,
    type SuspendedTextOutputCallback,
    type TextOutputCallback,
    FRCallback,
  } from '@forgerock/javascript-sdk';
  import sanitize from 'xss';

  import Centered from '$components/primitives/box/centered.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import T from '$components/_utilities/locale-strings.svelte';
  import Spinner from '$components/primitives/spinner/spinner.svelte';

  // Unused props. Setting to const prevents errors in console
  export let recoveryCodes: string[] = [];
  export let webAuthnValue: WebAuthnStepType = WebAuthnStepType.None;
  export let callback: SuspendedTextOutputCallback | TextOutputCallback | FRCallback;

  let dirtyMessage = '';
  let cleanMessage = '';
  if ('getMessage' in callback) {
    dirtyMessage = callback.getMessage();
    cleanMessage = '';
  }
  $: {
    if (!recoveryCodes.length && 'getMessage' in callback) {
      dirtyMessage = callback.getMessage();
      cleanMessage = sanitize(dirtyMessage);
    }
  }

  // center and bold first line of text
  // center second line of text
  // add a spinner for waiting.
</script>

{#if recoveryCodes.length > 0}
  <div class="tw_text-center">
    <Text classes="tw_block tw_text-center tw_p-px tw_font-extrabold"
      ><T key="recoveryCodesHeader" /></Text
    >
    <Text classes={'tw_block tw_text-center tw_p-px'}><T key="recoveryCodesText" /></Text>
    <div class="grid gap-4 grid-cols-1">
      <ul class="tw_list-inside tw_list-disc">
        {#each recoveryCodes as code}
          <li class="tw_block tw_text-center list-none pt-4"><Text>{code}</Text></li>
        {/each}
      </ul>
      <Text classes={'tw_p-px'}><T key="recoveryCodesFooter" /></Text>
    </div>
  </div>
{:else if webAuthnValue > 0}
  {#if webAuthnValue === 1}
    <div class="tw_text-center" aria-live="assertive">
      <Text classes={'tw_font-extrabold'}><T key="verifyingYourIdentity" /></Text>
      <Text><T key="useYourDeviceToVerify" /></Text>
    </div>
  {:else}
    <div class="tw_text-center" aria-live="assertive">
      <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_mb-6 tw_w-24" />
      <Text><T key="registeringYourDevice" /></Text>
      <Text><T key="yourDeviceWillBeUsedToVerify" /></Text>
    </div>
  {/if}
{:else}
  <Text classes="tw_font-bold tw_mt-6">
    {@html cleanMessage}
  </Text>
{/if}
