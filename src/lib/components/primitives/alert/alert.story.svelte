<script lang="ts">
  import Alert from './alert.svelte';

  export let message: string;
  export let type: 'error' | 'info' | 'success' | 'warning' | '';
</script>

<div>
  <Alert {type}>
    {message}
  </Alert>
</div>
