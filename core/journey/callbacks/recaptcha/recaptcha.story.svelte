<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Recaptcha from './recaptcha.svelte';

  import type { ReCaptchaCallback } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { CallbackMetadata } from '$journey/journey.interfaces';

  export let callback: ReCaptchaCallback;
  export let callbackMetadata: Maybe<CallbackMetadata> = null;
</script>

<Centered>
  <Recaptcha {callback} {callbackMetadata} />
</Centered>
