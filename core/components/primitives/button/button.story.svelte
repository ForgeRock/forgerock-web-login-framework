<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  /* eslint @typescript-eslint/no-empty-function: "off" */
  import Button from './button.svelte';

  interface Props {
    // Button props
    busy?: boolean;
    // export let customCss = [];
    onClick?: (event: Event) => void;
    style?: 'outline' | 'primary' | 'secondary';
    text: string;
    type?: 'button' | 'submit' | null;
    width?: 'auto' | 'full'; // initialize({ button: customCss });
  }

  let {
    busy = false,
    onClick = () => {},
    style = 'outline',
    text,
    type = null,
    width = 'auto',
  }: Props = $props();
</script>

<Button {busy} {onClick} {style} {type} {width}>
  {text}
</Button>
