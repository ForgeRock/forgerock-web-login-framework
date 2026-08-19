<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Alert from './alert.svelte';

  interface Props {
    message: string;
    type: 'error' | 'info' | 'success' | 'warning' | '';
  }

  let { message, type }: Props = $props();
</script>

<div>
  <Alert id="alertStory" {type}>
    {message}
  </Alert>
</div>
