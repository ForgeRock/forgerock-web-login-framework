<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Policies from './policies.svelte';

  import type {
    AttributeInputCallback,
    ValidatedCreatePasswordCallback,
    ValidatedCreateUsernameCallback,
  } from '@forgerock/journey-client/types';

  type ValidatedCallbacks =
    | AttributeInputCallback<boolean | string>
    | ValidatedCreatePasswordCallback
    | ValidatedCreateUsernameCallback;

  interface Props {
    callback: ValidatedCallbacks;
    label: string;
    messageKey: string;
  }

  let { callback, label, messageKey }: Props = $props();
</script>

<Centered>
  <Policies {callback} key="password-policies" {label} {messageKey} showPolicies={true} />
</Centered>
