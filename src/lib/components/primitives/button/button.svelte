<script lang="ts">
  export let fullWidth = false;
  export let onClick = (event: Event) => {};
  export let style = '';
  export let type: string | null = null;
</script>

<button
  class={(() => {
    let color;
    switch (style) {
      case 'primary':
        color = 'bg-blue text-white';
        break;
      case 'secondary':
        color = 'bg-gray text-white';
        break;
      default:
        color = '';
    }
    let width = fullWidth ? 'w-full' : '';

    return `${color} ${width} leading-6 text-base py-3 px-6 rounded`;
  })()}
  data-test="button-primitive"
  on:click={onClick}
  {type}>
    <slot />
</button>
