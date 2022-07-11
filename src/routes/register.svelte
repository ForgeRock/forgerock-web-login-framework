<script context="module" lang="ts">
  import Box from '$components/primitives/box/centered.svelte';
  // import { initialize, type InitObject } from '$journey/journey.store';

  import '../app.css';

  // Loads first step on server.
  // IMPORTANT: Requires `window` to be removed from timeout utility in JS SDK
  // export async function load() {
  //   let initObj = await initialize('Registration');

  //   return {
  //     props: { initObj },
  //   }
  // }
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  import Journey from '../lib/journey/journey.svelte';
  import { initialize, type InitObject } from '$journey/journey.store';

  let initObj: InitObject;

  // Use if not initializing journey in above "context module"
  onMount(async () => {
    initObj = await initialize('Registration');
  });
</script>

<Box>
  <Journey {initObj} />
</Box>
