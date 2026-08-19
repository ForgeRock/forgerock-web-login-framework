<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Link from './link.svelte';

  interface Props {
    classes: string;
    href: string;
  }

  let { classes, href }: Props = $props();
</script>

<Link {classes} {href}>Go to home page!</Link>
