<script lang="ts">
  import Grid from './grid.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
</script>

<Grid num={3}>
  <Input key="firstName" label="First name" onChange={() => {}} />
  <Input key="middleName" label="Middle name" onChange={() => {}} />
  <Input key="lastName" label="Last name" onChange={() => {}} />
</Grid>

<Grid num={2}>
  <Button style="secondary">
    Cancel
  </Button>
  <Button style="primary">
    Next
  </Button>
</Grid>
