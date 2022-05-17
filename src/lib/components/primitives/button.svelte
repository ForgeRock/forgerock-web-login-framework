<script lang="ts">
  export let fullWidth: boolean;
  export let onClick: (event: Event) => void;
  export let type: string;
</script>

<button
  class={(() => {
    let color;
    console.log(`Button type: ${type}`);

    switch (type) {
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
  on:click={onClick}>
    <slot />
</button>
