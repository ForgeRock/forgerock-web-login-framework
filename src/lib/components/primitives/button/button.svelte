<script lang="ts">
  /* eslint @typescript-eslint/no-empty-function: "off" */
  import Spinner from '$components/primitives/spinner/spinner.svelte';

  export let busy = false;
  export let classes = '';
  // export let customCss: { key: string; value: string }[] = [];
  export let onClick: (event: Event) => void = () => {};
  export let style: 'outline' | 'primary' | 'secondary' = 'outline';
  export let type: 'button' | 'submit' | null = null;
  export let width: 'auto' | 'full' = 'auto';

  function generateClassString(...args: string[]) {
    return args.reduce((prev, curr) => {
      switch (curr) {
        // Button style cases
        case 'primary':
          return `${prev} tw_button-primary dark:tw_button-primary_dark`;
        case 'secondary':
          return `${prev} tw_button-secondary dark:tw_button-secondary_dark`;
        case 'outline':
          return `${prev} tw_button-outline dark:tw_button-outline_dark`;
        // Button width cases
        case 'auto':
          return `${prev} tw_w-auto`;
        case 'full':
          return `${prev} tw_w-full`;
        default:
          return prev;
      }
    }, '');
  }
</script>

<button
  class={`${generateClassString(
    style,
    width,
  )} tw_button-base tw_focusable-element dark:tw_focusable-element_dark width-${width} ${classes}`}
  on:click={onClick}
  {type}
>
  {#if busy}
    <!-- Render a small spinner during form submission -->
    <Spinner colorClass="white" layoutClasses="tw_h-4 tw_w-4 tw_mr-2" />
  {/if}
  <slot>Submit</slot>
</button>
