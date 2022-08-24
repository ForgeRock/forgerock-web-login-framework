<script lang="ts">
  import AlertIcon from '$components/icons/alert-icon.svelte';
  import InfoIcon from '$components/icons/info-icon.svelte';
  import WarningIcon from '$components/icons/warning-icon.svelte';

  export let needsFocus = false;
  export let type: 'error' | 'info' | 'success' | 'warning' | '' = '';

  let divEl: HTMLParagraphElement;

  function generateClassString(...args: string[]) {
    return args.reduce((prev, curr) => {
      switch (curr) {
        // Button style cases
        case 'error':
          return `${prev} tw_alert-error dark:tw_alert-error_dark`;
        case 'info':
          return `${prev} tw_alert-info dark:tw_alert-info_dark`;
        case 'success':
          return `${prev} tw_alert-success dark:tw_alert-success_dark`;
        case 'warning':
          return `${prev} tw_alert-warning dark:tw_alert-warning_dark`;
        default:
          return prev;
      }
    }, '');
  }

  $: {
    if (needsFocus) {
      divEl && divEl.focus();
    }
  }
</script>

<div
  bind:this={divEl}
  class={`${generateClassString(type)} tw_alert dark:tw_alert_dark tw_input-spacing`}
  tabindex="-1"
>
  <p class="tw_grid tw_grid-cols-[2em_1fr]">
    {#if type === 'error'}
      <AlertIcon />
    {:else if type === 'warning'}
      <WarningIcon />
    {:else}
      <InfoIcon />
    {/if}
    <span>
      <slot />
    </span>
  </p>
</div>
