<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import RecaptchaEnterprise from './recaptcha-enterprise.svelte';

  import type { ReCaptchaEnterpriseCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { CallbackMetadata } from '$journey/journey.interfaces';

  interface Props {
    callback: ReCaptchaEnterpriseCallback;
    callbackMetadata?: Maybe<CallbackMetadata>;
  }

  let { callback, callbackMetadata = null }: Props = $props();
</script>

<Centered>
  <RecaptchaEnterprise {callback} {callbackMetadata} />
</Centered>
