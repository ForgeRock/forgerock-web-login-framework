<script lang="ts">
  /* eslint @typescript-eslint/no-empty-function: "off" */
  import Grid from './grid.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
</script>

<Grid num={3}>
  <Input isFirstInvalidInput={false} key="firstName" label="First name" onChange={() => {}} />
  <Input isFirstInvalidInput={false} key="middleName" label="Middle name" onChange={() => {}} />
  <Input isFirstInvalidInput={false} key="lastName" label="Last name" onChange={() => {}} />
</Grid>

<Grid num={2}>
  <Button onClick={() => {}} style="secondary">Cancel</Button>
  <Button onClick={() => {}} style="primary">Next</Button>
</Grid>
