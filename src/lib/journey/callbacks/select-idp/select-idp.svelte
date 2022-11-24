<script lang="ts">
  import type { SelectIdPCallback } from '@forgerock/javascript-sdk';
  import AppleIcon from '../../../components/icons/apple-icon.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Grid from '$components/primitives/grid/grid.svelte';
  import { interpolate, textToKey } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: SelectIdPCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  let inputName: string;
  let label: string;
  let idps: { value: string; text: string }[];
  let buttonStyle: 'outline' | 'primary' | 'secondary' | undefined;

  /**
   * @function setButtonValue - Sets the value on the callback on button click
   * @param {number} index
   */
  function setBtnValue(value: string) {
    callback.setProvider(value);
    callbackMetadata.isReadyForSubmission = true;
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

<Grid num={idps.length}>
  {#each idps as idp}
    <Button type="button" width="auto" onClick={() => setBtnValue(idp.value)}
      ><AppleIcon
        classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"
      />
      <T key="signInWith" />
      {idp.text}
    </Button>
  {/each}
</Grid>

{#if stepMetadata.numOfCallbacks > 1}
  <Grid num={1}>
    <hr />
  </Grid>
{/if}
