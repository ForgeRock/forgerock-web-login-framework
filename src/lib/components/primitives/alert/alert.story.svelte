<script lang="ts">
  import Alert from './alert.svelte';

  export let message: string;
  export let type: 'error' | 'info' | 'success' | 'warning' | '';
</script>

<div>
  <Alert id="alertStory" {type}>
    {message}
  </Alert>
</div>
