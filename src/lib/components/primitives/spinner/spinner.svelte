<script lang="ts">
  export let colorClass: string;
  export let layoutClasses: string;
</script>

<div
  class={`tw_spinner tw_animate-spin tw_border-4 tw_inline-block tw_rounded-full ${colorClass} ${layoutClasses}`}
  role="status"
>
  <span class="tw_sr-only">Loading...</span>
</div>
