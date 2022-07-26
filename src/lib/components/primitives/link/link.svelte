<script lang="ts">
  export let classes = '';
  export let href: string;
</script>

<a class={`${classes} tw_link dark:tw_link_dark`} {href}>
  <slot />
</a>
