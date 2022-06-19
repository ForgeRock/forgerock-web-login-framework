<script lang="ts">
  export let key: string;
  export let classes = '';
</script>

<label for={key} class={`${classes} tw_input-label dark:tw_input-label_dark`}>
  <slot />
</label>
