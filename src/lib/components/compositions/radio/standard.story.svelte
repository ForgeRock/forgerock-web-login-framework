<script lang="ts">
  import Radio from "./standard.svelte";

  export let defaultOption: number = 0;
  export let key: string;
  export let label: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: {  text: string; value: number | null; }[];
  export let value: boolean;
</script>

<div>
  <Radio {defaultOption} {key} {name} {onChange} {options}>
    {label}
  </Radio>
</div>
