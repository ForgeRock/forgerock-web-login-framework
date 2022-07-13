<script lang="ts">
  export let num: number = 2;

  function generateClassString(...args: number[]) {
    return args.reduce((prev, curr) => {
      switch(curr) {
        case 4:
          return `${prev} tw_grid-cols-4`;
        case 3:
          return `${prev} tw_grid-cols-3`;
        case 2:
          return `${prev} tw_grid-cols-2`;
        default:
          return `${prev} tw_grid-cols-1`;
      }
    }, '');
  }
</script>

<div class={`tw_grid ${generateClassString(num)} tw_gap-4`}>
  <slot />
</div>
