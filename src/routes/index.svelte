<script context="module" lang="ts">
  import Box from '$components/primitives/box/centered.svelte';
  import { initTree, type InitObject } from '$journey/journey.store';

  import '../app.css';

  export async function load() {
    let initObj = await initTree(null);

    return {
      props: { initObj },
    }
  }
</script>

<script lang="ts">
  import Journey from '../lib/journey/journey.svelte';

  export let initObj: InitObject;
</script>

<Box>
  <Journey {initObj} />
</Box>
