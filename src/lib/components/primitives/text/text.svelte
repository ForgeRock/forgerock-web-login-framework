<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  export let classes = '';
</script>

<p
  class={`${classes} tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_input-spacing`}
>
  <slot />
</p>
