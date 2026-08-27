<!--
@component
Type: stage
Name: HelloWorldStyles

DEMO COMPONENT — Step 4: scoped styles
-->

<script lang="ts">
  import { Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <section class="tutorial-card">
    <span class="tutorial-step">Step 4 · Scoped styles</span>
    <h1>Hello World! <span class="tutorial-sparkle" aria-hidden="true">✦</span></h1>
    <p>
      This gradient border, glow, and button are defined entirely in this component's own
      &lt;style&gt; block, isolated from every other step in the journey.
    </p>

    <button class="tutorial-next" disabled={journey?.loading} type="submit">Next →</button>
  </section>
</Form>

<style>
  .tutorial-card {
    background:
      linear-gradient(#eff6ff, #eff6ff) padding-box,
      linear-gradient(135deg, #7c3aed, #2563eb, #db2777) border-box;
    border: 2px solid transparent;
    border-radius: 1rem;
    box-shadow: 0 12px 32px -8px rgb(124 58 237 / 25%);
    color: #1e3a8a;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    padding: 1.75rem;
  }

  .tutorial-step {
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .tutorial-card h1 {
    align-items: center;
    display: flex;
    font-size: 2.25rem;
    font-weight: 300;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
  }

  .tutorial-sparkle {
    animation: sparkle-pulse 2s ease-in-out infinite;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-size: 1.5rem;
  }

  @keyframes sparkle-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.2) rotate(15deg);
    }
  }

  :global(.dark) .tutorial-card {
    background:
      linear-gradient(#172554, #172554) padding-box,
      linear-gradient(135deg, #7c3aed, #2563eb, #db2777) border-box;
    color: #dbeafe;
  }

  .tutorial-next {
    background: linear-gradient(135deg, #7c3aed, #2563eb, #db2777);
    background-size: 150% 100%;
    background-position: 0% 0%;
    border: none;
    border-radius: 0.5rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    text-align: center;
    transition:
      background-position 0.35s ease,
      transform 0.15s ease;
    width: 100%;
  }

  .tutorial-next:hover:not(:disabled) {
    background-position: 100% 0%;
    transform: translateY(-1px);
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
