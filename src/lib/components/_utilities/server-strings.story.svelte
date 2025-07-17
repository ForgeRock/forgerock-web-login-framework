<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import Sanitize from '$components/_utilities/server-strings.svelte';
</script>

<Centered>
  <Text>
    <Sanitize html={true} string="Signing up is fast and easy.<br>Already have an account? <a href='#/service/Login' onmouseover=alert('Danger!')>Sign In</a>" />
  </Text>
</Centered>
