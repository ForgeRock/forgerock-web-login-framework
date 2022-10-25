<script lang="ts">
  export let classes = '';
</script>

<p
  class={`${classes} tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_input-spacing`}
>
  <slot />
</p>
