<script lang="ts">
  export let num = 2;

  function generateClassString(...args: Array<number | string>) {
    return args.reduce((prev, curr) => {
      switch (curr) {
        case 4:
          return `${prev} md:tw_grid-cols-4`;
        case 3:
          return `${prev} md:tw_grid-cols-3`;
        case 2:
          return `${prev} md:tw_grid-cols-2`;
        default:
          return `${prev} md:tw_grid-cols-1`;
      }
    }, '');
  }
</script>

<div class={`${generateClassString(num)} tw_gap-4 tw_grid tw_grid-cols-1 tw_input-spacing`}>
  <slot />
</div>
