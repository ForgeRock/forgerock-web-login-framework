<script lang="ts">
  export let classes = '';
  export let href: string;
</script>

<a
  class={`${classes} tw_text-blue-600 dark:tw_text-blue-400 tw_underline hover:tw_no-underline`}
  {href}
>
  <slot />
</a>
