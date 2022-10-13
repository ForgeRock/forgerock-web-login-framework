<script lang="ts">
  import Radio from './animated.svelte';

  export let defaultOption = 0;
  export let key: string;
  export let label: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { text: string; value: number | null }[];
</script>

<div>
  <Radio {defaultOption} isFirstInvalidInput={false} {key} {name} {onChange} {options}>
    {label}
  </Radio>
</div>
