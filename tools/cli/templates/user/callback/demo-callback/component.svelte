<!-- @component Type: callback Name: DemoCallback -->
<script>
  import { formatCallbackName } from './utility';

  export let callback;
  export let callbackMetadata;
  export let selfSubmitFunction;
  export let stepMetadata;
  export let style;

  $: callbackName = formatCallbackName(callback);
  $: callbackType = callback.getType();
</script>

<div
  class="demo-callback"
  style="border: 2px dashed #888; border-radius: 8px; padding: 16px; margin: 8px 0;"
>
  <p style="margin: 0 0 8px; font-weight: bold; color: #555;">
    Custom Callback: {callbackName}
  </p>
  <p style="margin: 0; font-size: 0.85em; color: #999;">
    Type: {callbackType} | Index: {callbackMetadata?.idx ?? 'N/A'}
  </p>
</div>
