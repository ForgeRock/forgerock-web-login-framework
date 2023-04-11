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
