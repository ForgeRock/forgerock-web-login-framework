<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';
  import Message from '$components/primitives/message/input-message.svelte';

  import type { Snippet } from 'svelte';

  import type { Maybe } from '$core/interfaces';

  interface Props {
    checkValidity?: ((event: Event) => boolean) | null;
    message?: string;
    isFirstInvalidInput: boolean;
    isRequired?: boolean;
    isInvalid?: boolean;
    key: string;
    onChange: (event: Event) => void;
    showMessage?: Maybe<boolean>;
    value: boolean;
    children?: Snippet;
  }

  let {
    checkValidity = null,
    message = '',
    isFirstInvalidInput,
    isRequired = false,
    isInvalid = $bindable(),
    key,
    onChange,
    showMessage = undefined,
    value,
    children,
  }: Props = $props();

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }
</script>

<!--
  NOTE: The below wrapper is creating a grid, setting the first column to 1.5em
  and the second column as one flexible unit (1fr).
-->
<div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
  <Checkbox {isFirstInvalidInput} {isRequired} {isInvalid} {key} onChange={onChangeWrapper} {value}>
    {@render children?.()}
  </Checkbox>
  <!--
    NOTE: The below places the error message on the second row and in second
    column to match the label's layout.
   -->
  <span class="tw_col-start-2 tw_row-start-2" id={`${key}-message`}>
    <Message dirtyMessage={message} {showMessage} type={isInvalid ? 'error' : 'info'} />
  </span>
</div>
