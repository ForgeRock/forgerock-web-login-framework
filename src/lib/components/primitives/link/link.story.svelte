<script lang="ts">
  import Link from './link.svelte';

  export let classes: string;
  export let href: string;
</script>

<Link {classes} {href}>Go to home page!</Link>
