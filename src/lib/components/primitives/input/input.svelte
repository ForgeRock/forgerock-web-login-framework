<script lang="ts">
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text';
  export let value: string | null = null;
</script>

<div>
  <input
    id={key}
    {type}
    on:change={onChange}
    class="border-gray-light bg-white block leading-6 mb-4 p-3 rounded text-base text-gray-dark w-full"
    {value}
    placeholder={label}
  />
  <label for={key} class="absolute border border-transparent inset-0 leading-6 p-3 text-gray">{label}</label>
</div>

<style>
  /**
   * Essentially the same technique as Twitter Bootstrap's v5 "floating label"
   * https://getbootstrap.com/docs/5.0/forms/floating-labels/
   *
   * TODO: See if the new CSS pseudo-selector `has()` can replace below technique
   */
  div {
    position: relative;
  }
  input {
    height: calc(1.5em + 1.5rem + 2px);
    background-clip: padding-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  input::placeholder {
    color: transparent;
  }
  label {
    height: calc(100% - 2px);
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
</style>
