<script lang="ts">
  import type { SelectIdPCallback } from '@forgerock/javascript-sdk';
  import AppleIcon from '../../../components/icons/apple-icon.svelte';
  import FacebookIcon from '../../../components/icons/facebook-icon.svelte';
  import GoogleIcon from '../../../components/icons/google-icon.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Grid from '$components/primitives/grid/grid.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export const style: Style = {};

  export let callback: SelectIdPCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: Maybe<StepMetadata>;

  let idps: { value: string; text: string }[];

  /**
   * @function setButtonValue - Sets the value on the callback on button click
   * @param {number} index
   */
  function setBtnValue(value: string) {
    callback.setProvider(value);
    if (callbackMetadata) { callbackMetadata.derived.isReadyForSubmission = true; }
    selfSubmitFunction && selfSubmitFunction();
  }

  $: {
    const localAuthentication = callback
      .getProviders()
      .filter((provider) => provider.provider === 'localAuthentication');

    const socialProviders = callback
      .getProviders()
      .filter((provider) => provider.provider !== 'localAuthentication');

    if (localAuthentication.length > 0) {
      // Assume that clicking "next" will indicate the user wants to use local authentication
      callback.setProvider('localAuthentication');
    }

    idps = socialProviders.map((option, index) => ({
      value: option.provider,
      text: option.uiConfig.buttonDisplayName,
    }));
  }
</script>

{#each idps as idp}
  <Grid num={1}>
    {#if idp.text.toUpperCase().includes('APPLE')}
      <Button
        classes="tw_button-apple dark:tw_button-apple_dark"
        type="button"
        width="auto"
        onClick={() => setBtnValue(idp.value)}
      >
        <AppleIcon classes="tw_inline-block tw_fill-current" />
        <T key="continueWith" />
        {idp.text}
      </Button>
    {:else if idp.text.toUpperCase().includes('FACEBOOK')}
      <Button
        classes="tw_button-facebook dark:tw_button-facebook_dark"
        type="button"
        width="auto"
        onClick={() => setBtnValue(idp.value)}
      >
        <FacebookIcon classes="tw_inline-block tw_fill-current" />
        <T key="continueWith" />
        {idp.text}
      </Button>
    {:else if idp.text.toUpperCase().includes('GOOGLE')}
      <Button
        classes="tw_button-google dark:tw_button-google_dark"
        type="button"
        width="auto"
        onClick={() => setBtnValue(idp.value)}
      >
        <GoogleIcon classes="tw_inline-block tw_fill-current" />
        <T key="continueWith" />
        {idp.text}
      </Button>
    {/if}
  </Grid>
{/each}

{#if stepMetadata && stepMetadata.derived.numOfCallbacks > 1}
  <Grid num={1}>
    <hr class="tw_border-0 tw_border-b tw_border-secondary-light dark:tw_border-secondary-dark" />
  </Grid>
{/if}
