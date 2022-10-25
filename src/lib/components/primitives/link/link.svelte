<script lang="ts">
  export let classes = '';
  export let href: string;
  export let target: '_blank' | '_parent' | '_self' | '_top' = '_self';
</script>

<a class={`${classes} tw_link dark:tw_link_dark`} {href} {target}>
  <slot />
</a>
