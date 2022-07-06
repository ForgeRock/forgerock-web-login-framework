<script context="module" lang="ts">
  import Box from '$components/primitives/box/centered.svelte';
  import { initTree, type InitObject } from '$journey/journey.store';

  export async function load() {
    let initObj = await initTree('Registration');

    return {
      props: { initObj },
    }
  }
</script>

<script lang="ts">
  import Journey from '../lib/journey/journey.svelte';
  import NewUserIcon from '../lib/components/icons/new-user-icon.svelte';

  export let initObj: InitObject;
</script>

<Box>
  <div class="tw_flex tw_justify-center">
    <NewUserIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
  </div>
  <h1 class="tw_primary-header dark:tw_primary-header_dark">Sign Up</h1>
  <Journey {initObj} />
</Box>
