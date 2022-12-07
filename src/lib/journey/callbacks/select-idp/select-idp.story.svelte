<script lang="ts">
  import type { PasswordCallback } from '@forgerock/javascript-sdk';
  import type { SelectIdPCallback } from '@forgerock/javascript-sdk';
  import type { NameCallback } from '@forgerock/javascript-sdk';

  import Centered from '$components/primitives/box/centered.svelte';
  import Password from '../password/password.svelte';
  import SelectIdp from './select-idp.svelte';
  import Username from '../username/name.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  export let passwordCallback: PasswordCallback;
  export let socialCallback: SelectIdPCallback;
  export let usernameCallback: NameCallback;
  export let localAuth: boolean;

  let callbackMetadata = {
    canForceUserInputOptionality: true,
    isFirstInvalidInput: false,
    isReadyForSubmission: false,
    isSelfSubmitting: false,
    isUserInputRequired: true,
    idx: 0,
  };
  let stepMetadata = {
    isStepSelfSubmittable: false,
    isUserInputOptional: true,
    numOfCallbacks: 2,
    numOfSelfSubmittableCbs: 0,
    numOfUserInputCbs: 2,
  };
</script>

<Centered>
  <SelectIdp callback={socialCallback} {callbackMetadata} {stepMetadata} />
  {#if usernameCallback}
    <Username callback={usernameCallback} {callbackMetadata} {stepMetadata} />
  {/if}
  {#if passwordCallback}
    <Password callback={passwordCallback} {callbackMetadata} {stepMetadata} />
  {/if}
  {#if localAuth && usernameCallback && passwordCallback}
    <Button style="primary" type="submit" width="full">
      <T key="nextButton" />
    </Button>
  {/if}
</Centered>
