<script lang="ts">
  import type {
    AttributeInputCallback,
    ValidatedCreateUsernameCallback,
    ValidatedCreatePasswordCallback,
  } from '@forgerock/javascript-sdk';

  import Centered from "$components/primitives/box/centered.svelte";
  import Policies from "./policies.svelte";

  type ValidatedCallbacks =
  | AttributeInputCallback<boolean | string>
  | ValidatedCreatePasswordCallback
  | ValidatedCreateUsernameCallback;

  export let callback: ValidatedCallbacks;
  export let label: string;
  export let messageKey: string;
</script>

<Centered>
  <Policies {callback} {label} {messageKey} />
</Centered>
