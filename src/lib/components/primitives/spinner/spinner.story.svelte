<script lang="ts">
  import Spinner from './spinner.svelte';

  export let colorClass: string;
  export let layoutClasses: string;
</script>

<div class="tw_text-center">
  <Spinner {colorClass} {layoutClasses} />
</div>
