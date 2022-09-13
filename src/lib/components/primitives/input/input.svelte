<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Label from '$components/primitives/label/label.svelte';

  export let firstInvalidInput: boolean;
  export let inputClasses = '';
  export let key: string;
  export let label: string;
  export let labelClasses = '';
  export let labelOrder: 'first' | 'last' = 'first';
  export let onChange: (event: Event) => void;
  export let placeholder: string | null = null;
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value = '';

  let inputEl: HTMLInputElement;

  afterUpdate(() => {
    if (firstInvalidInput) {
      inputEl.focus();
    }
  });
</script>

{#if labelOrder === 'first'}
  <Label {key} classes={`${labelClasses}`}>{label}</Label>
{/if}

<!--
  Because we are using "two-way binding" with `bind:value`,
  Svelte will error when `type` is dynamic. This is the reason
  for the duplication below.
-->
{#if type === 'date'}
  <input
    aria-describedby={`${key}-message`}
    aria-invalid={isInvalid}
    bind:this={inputEl}
    class={`${inputClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`}
    id={key}
    on:change={onChange}
    placeholder={placeholder || label}
    required={isRequired}
    type="date"
    bind:value
  />
{/if}

{#if type === 'email'}
  <input
    aria-describedby={`${key}-message`}
    aria-invalid={isInvalid}
    bind:this={inputEl}
    class={`${inputClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`}
    id={key}
    on:change={onChange}
    placeholder={placeholder || label}
    required={isRequired}
    type="email"
    bind:value
  />
{/if}

{#if type === 'number'}
  <input
    aria-describedby={`${key}-message`}
    aria-invalid={isInvalid}
    bind:this={inputEl}
    class={`${inputClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`}
    id={key}
    on:change={onChange}
    placeholder={placeholder || label}
    required={isRequired}
    type="number"
    bind:value
  />
{/if}

{#if type === 'password'}
  <input
    aria-describedby={`${key}-message`}
    aria-invalid={isInvalid}
    bind:this={inputEl}
    class={`${inputClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`}
    id={key}
    on:change={onChange}
    placeholder={placeholder || label}
    required={isRequired}
    type="password"
    bind:value
  />
{/if}

{#if type === 'phone'}
  <input
    aria-describedby={`${key}-message`}
    aria-invalid={isInvalid}
    bind:this={inputEl}
    class={`${inputClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`}
    id={key}
    on:change={onChange}
    placeholder={placeholder || label}
    required={isRequired}
    type="phone"
    bind:value
  />
{/if}

{#if type === 'text'}
  <input
    aria-describedby={`${key}-message`}
    aria-invalid={isInvalid}
    bind:this={inputEl}
    class={`${inputClasses} tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`}
    id={key}
    on:change={onChange}
    placeholder={placeholder || label}
    required={isRequired}
    type="text"
    bind:value
  />
{/if}

{#if labelOrder === 'last'}
  <Label {key} classes={`${labelClasses}`}>{label}</Label>
{/if}
