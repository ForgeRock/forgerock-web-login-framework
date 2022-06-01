<script lang='ts'>
  export let classes = '';
  export let size = '24px';
</script>

<svg
  class={classes}
  height={size}
  width={size}
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M0 0h24v24H0z" fill="none" />
  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  <title><slot /></title>
</svg>
