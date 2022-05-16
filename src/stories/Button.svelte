<script lang="ts">
  import './button.css';
  import { createEventDispatcher } from 'svelte';
  /**
   * Is this the principal call to action on the page?
   */
  export let primary: boolean = false;

  /**
   * What background color to use
   */
  export let backgroundColor;
  /**
   * How large should the button be?
   */
  export let size = 'medium';
  /**
   * Button contents
   */
  export let label = '';

  let mode = primary ? 'storybook-button--primary' : 'storybook-button--secondary';

  let style = backgroundColor ? `background-color: ${backgroundColor}` : '';

  const dispatch = createEventDispatcher();

  /**
   * Optional click handler
   */
  function onClick(event) {
    console.log('Hello')
    dispatch('click', event);
  }
</script>

<button
  type="button"
  class="bg-black text-white rounded px-4 py-1"
  {style}
  on:click={onClick}>
  {label}
</button>
