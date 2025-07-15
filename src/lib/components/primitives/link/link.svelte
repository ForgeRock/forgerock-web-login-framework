<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  export let classes = '';
  export let href: string;
  export let target: '_blank' | '_parent' | '_self' | '_top' = '_self';
</script>

<a class={`${classes} tw_link dark:tw_link_dark`} {href} {target}>
  <slot />
</a>
