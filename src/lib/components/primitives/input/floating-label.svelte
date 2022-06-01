<script lang="ts">
  export let hasRightIcon = false;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let isRequired = false;
  // TODO: Placeholders don't reliably work with floating labels
  // export let placeholder: string;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value: string | null = null;
  export let width: 'full' | 'half' = 'full';
</script>

<div class={`width-${width} tw_justify-items-stretch tw_flex tw_mb-4 tw_relative tw_flex-wrap`}>
  <!--
    TODO: Improve layout of floating label. Maybe use grid instead of Twitter's CSS?
    NOTE: `placeholder` for the input is required for Twitter Bootstrap's floating label
  -->
  <input
    class={`tw_border tw_border-gray ${hasRightIcon ? 'tw_border-r-0': ''} tw_bg-white tw_block tw_flex-1 tw_leading-6 tw_p-3 tw_rounded ${hasRightIcon ? 'tw_rounded-r-none' : ''} tw_text-base tw_text-gray-dark`}
    id={key}
    on:change={onChange}
    placeholder={label}
    {type}
    required={isRequired}
    {value}
  />
  <label for={key} class="tw_absolute tw_border tw_border-transparent tw_leading-6 tw_p-3 tw_text-gray-dark"
    >{label}</label
  >
  <slot />
</div>

<style>
  /**
   * Essentially the same technique as Twitter Bootstrap's v5 "floating label"
   * https://getbootstrap.com/docs/5.0/forms/floating-labels/
   *
   * TODO: See if the new CSS pseudo-selector `has()` can replace below technique
   * when it gets full browser support
   *
   * TODO: Move more of this into Tailwind classes
   */
  input {
    height: calc(3rem + 2px);
    background-clip: padding-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  input::placeholder {
    color: transparent;
  }
  ::-ms-reveal {
    display: none
  }
  label {
    height: calc(3rem + 2px);
    pointer-events: none;
    transform-origin: 0 0;
    transition: opacity 0.1s ease-in-out, transform 0.1s ease-in-out;
  }

  input:focus,
  input:not(:placeholder-shown) {
    padding-top: 1.625rem;
    padding-bottom: 0.625rem;
  }
  input:focus ~ label,
  input:not(:placeholder-shown) ~ label {
    opacity: 0.65;
    transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
  }
  .width-full {
    @apply tw_w-full;
  }
  .width-half {
    @apply tw_w-1/2;
  }
</style>
