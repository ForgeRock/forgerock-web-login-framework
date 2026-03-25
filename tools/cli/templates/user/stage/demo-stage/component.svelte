<!-- @component Type: stage Name: DemoStage -->
<script>
  import { formatStageName } from './utility';

  export let componentStyle;
  export let form;
  export let formEl;
  export let journey;
  export let metadata;
  export let step;

  $: stageName = formatStageName(step);
</script>

<div
  class="demo-stage"
  style="border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; margin: 16px 0;"
>
  <h2 style="margin: 0 0 16px; color: #3b82f6; font-size: 1.25rem;">
    Custom Stage: {stageName}
  </h2>

  <div class="demo-stage-callbacks">
    {#each step.callbacks as callback, idx}
      <div style="margin: 8px 0; padding: 8px; background: #f8fafc; border-radius: 4px;">
        <span style="font-size: 0.85em; color: #64748b;">
          Callback {idx + 1}: {callback.getType()}
        </span>
      </div>
    {/each}
  </div>
</div>
