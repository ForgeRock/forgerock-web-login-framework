<!--
  BFF v2: Stateless form-based authentication with progressive enhancement.

  Tier 1 (No JS): Standard HTML forms → full page reload on each step.
  Tier 2 (JS): use:enhance intercepts form submission → SPA-like UX.
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {import('./$types').ActionData} */
  export let form;

  // After a form action, `form` is non-null with the action's result.
  // The discriminated union _tag drives all rendering decisions.
  $: result = form !== null ? form : data;
  $: currentStep = result._tag === 'Step' ? result.step : null;
  $: error = result._tag === 'Error' || result._tag === 'Defect' ? result.error : null;
  $: authComplete = result._tag === 'AuthComplete';
  $: needsInit = result._tag === 'Step' && result.step.callbacks.length === 0;

  // Auto-submit the init form after hydration (JS-enhanced path).
  // This must run in onMount (not an inline <script>) so that
  // use:enhance is already registered and can intercept the submit
  // as a fetch POST rather than a full-page navigation.
  onMount(() => {
    if (needsInit) {
      const initForm = document.querySelector('form[action="?/init"]') as HTMLFormElement;
      if (initForm) initForm.requestSubmit();
    }
  });

  /** Determine the input type for a callback */
  function getInputType(callbackType: string): string {
    switch (callbackType) {
      case 'PasswordCallback':
        return 'password';
      case 'BooleanAttributeInputCallback':
      case 'TermsAndConditionsCallback':
        return 'checkbox';
      default:
        return 'text';
    }
  }

  /** Check if a callback type requires JavaScript (no-JS fallback needed) */
  function requiresJavaScript(callbackType: string): boolean {
    const jsRequiredTypes = new Set([
      'DeviceProfileCallback',
      'WebAuthn',
      'ReCaptchaCallback',
      'PollingWaitCallback',
      'PingOneProtectEvaluationCallback',
      'PingOneProtectInitializeCallback',
    ]);
    return jsRequiredTypes.has(callbackType);
  }

  /** Check if a callback is a text/message display (no input needed) */
  function isOutputOnly(callbackType: string): boolean {
    return callbackType === 'TextOutputCallback' || callbackType === 'MetadataCallback';
  }

  /** Get output value by name from a callback */
  function getOutput(
    callback: { output: Array<{ name: string; value: unknown }> },
    name: string,
  ): unknown {
    return callback.output.find((o) => o.name === name)?.value;
  }
</script>

<div class="tw_flex tw_justify-center tw_items-center tw_min-h-screen tw_p-4">
  <div class="tw_w-full tw_max-w-md">
    {#if authComplete}
      <!-- Auth complete — redirect to OAuth or show success -->
      <div class="tw_text-center tw_p-8">
        <h2 class="tw_text-xl tw_font-semibold tw_mb-4">Authentication Successful</h2>
        <p class="tw_text-gray-600">Redirecting...</p>
      </div>
    {:else if error}
      <!-- Error state — show error and restart button -->
      <div class="tw_p-6 tw_rounded-lg tw_border tw_border-red-200 tw_bg-red-50">
        <h2 class="tw_text-lg tw_font-semibold tw_text-red-800 tw_mb-2">Error</h2>
        <p class="tw_text-red-700 tw_mb-4">{error}</p>
        <form method="POST" action="?/init" use:enhance>
          <button
            type="submit"
            class="tw_button-base tw_focusable-element dark:tw_focusable-element_dark tw_button-primary dark:tw_button-primary_dark tw_w-full"
          >
            Try Again
          </button>
        </form>
      </div>
    {:else if needsInit}
      <!-- No step data — need to initialize the flow -->
      <form method="POST" action="?/init" use:enhance>
        <div class="tw_text-center tw_p-8">
          <p class="tw_text-gray-600 tw_mb-4">Starting authentication...</p>
          <noscript>
            <button
              type="submit"
              class="tw_button-base tw_focusable-element dark:tw_focusable-element_dark tw_button-primary dark:tw_button-primary_dark"
            >
              Start
            </button>
          </noscript>
        </div>
      </form>
    {:else if currentStep}
      <!-- Render the current authentication step -->
      <div class="tw_p-6 tw_rounded-lg tw_border tw_border-gray-200 tw_bg-white dark:tw_bg-gray-900 dark:tw_border-gray-700">
        {#if currentStep.header}
          <h2 class="tw_text-xl tw_font-semibold tw_mb-2">{currentStep.header}</h2>
        {/if}
        {#if currentStep.description}
          <p class="tw_text-gray-600 dark:tw_text-gray-400 tw_mb-4">{currentStep.description}</p>
        {/if}

        <form method="POST" action="?/step" use:enhance>
          {#each currentStep.callbacks as callback}
            {#if requiresJavaScript(callback.type)}
              <!-- JS-required callback: show noscript fallback -->
              <div class="tw_mb-4">
                <noscript>
                  <p class="tw_text-amber-600 tw_text-sm">
                    This step requires JavaScript to be enabled.
                  </p>
                </noscript>
                <div class="tw_hidden" data-callback-type={callback.type}>
                  <!-- JS will handle this callback -->
                </div>
              </div>
            {:else if isOutputOnly(callback.type)}
              <!-- Text output / metadata — display only -->
              <div class="tw_mb-4">
                {#if callback.type === 'TextOutputCallback'}
                  <p class="tw_text-gray-700 dark:tw_text-gray-300">
                    {getOutput(callback, 'message') ?? getOutput(callback, 'messageType')}
                  </p>
                {/if}
              </div>
            {:else if callback.type === 'TermsAndConditionsCallback'}
              <!-- Terms and conditions with scrollable text -->
              <div class="tw_mb-4">
                <div class="tw_border tw_rounded tw_p-3 tw_max-h-48 tw_overflow-y-auto tw_mb-2 tw_text-sm tw_text-gray-600 dark:tw_text-gray-400">
                  {getOutput(callback, 'terms')}
                </div>
                {#each callback.input as input}
                  <label class="tw_flex tw_items-center tw_gap-2">
                    <input
                      type="checkbox"
                      name={input.name}
                      value="true"
                      class="tw_rounded tw_border-gray-300"
                    />
                    <span class="tw_text-sm">I accept the terms and conditions</span>
                  </label>
                {/each}
              </div>
            {:else if callback.type === 'ChoiceCallback'}
              <!-- Choice / select dropdown -->
              <div class="tw_mb-4">
                <label class="tw_block tw_text-sm tw_font-medium tw_mb-1">
                  {getOutput(callback, 'prompt')}
                </label>
                {#each callback.input as input}
                  <select
                    name={input.name}
                    class="tw_w-full tw_rounded tw_border tw_border-gray-300 tw_p-2 dark:tw_bg-gray-800 dark:tw_border-gray-600"
                  >
                    {#each ((getOutput(callback, 'choices') ?? []) as string[]) as choice, idx}
                      <option value={idx}>{choice}</option>
                    {/each}
                  </select>
                {/each}
              </div>
            {:else if callback.type === 'ConfirmationCallback'}
              <!-- Confirmation buttons -->
              <div class="tw_mb-4 tw_flex tw_gap-2">
                {#each ((getOutput(callback, 'options') ?? []) as string[]) as option, idx}
                  {#each callback.input as input}
                    <button
                      type="submit"
                      name={input.name}
                      value={idx}
                      class="tw_button-base tw_focusable-element dark:tw_focusable-element_dark tw_flex-1
                        {idx === 0
                          ? 'tw_button-primary dark:tw_button-primary_dark'
                          : 'tw_button-secondary dark:tw_button-secondary_dark'}"
                    >
                      {option}
                    </button>
                  {/each}
                {/each}
              </div>
            {:else if callback.type === 'SelectIdPCallback'}
              <!-- Social login / IDP selection -->
              <div class="tw_mb-4">
                <label class="tw_block tw_text-sm tw_font-medium tw_mb-1">
                  {getOutput(callback, 'prompt') ?? 'Select a provider'}
                </label>
                {#each callback.input as input}
                  {#each ((getOutput(callback, 'providers') ?? []) as Array<{ provider: string; uiConfig?: { buttonDisplayName?: string } }>) as provider}
                    <button
                      type="submit"
                      name={input.name}
                      value={provider.provider}
                      class="tw_button-base tw_focusable-element dark:tw_focusable-element_dark tw_button-secondary dark:tw_button-secondary_dark tw_w-full tw_mb-2"
                    >
                      {provider.uiConfig?.buttonDisplayName ?? provider.provider}
                    </button>
                  {/each}
                {/each}
              </div>
            {:else}
              <!-- Standard input callbacks (Name, Password, StringAttribute, etc.) -->
              {#each callback.input as input}
                <div class="tw_mb-4">
                  {#if getInputType(callback.type) === 'checkbox'}
                    <!-- Checkbox: single wrapping label provides the accessible name -->
                    <label class="tw_flex tw_items-center tw_gap-2">
                      <input
                        type="checkbox"
                        id={input.name}
                        name={input.name}
                        value="true"
                        class="tw_rounded tw_border-gray-300"
                      />
                      <span class="tw_text-sm">{getOutput(callback, 'prompt') ?? ''}</span>
                    </label>
                  {:else}
                    <!-- Text/password: block label + input linked by for/id -->
                    <label class="tw_block tw_text-sm tw_font-medium tw_mb-1" for={input.name}>
                      {getOutput(callback, 'prompt') ?? input.name}
                    </label>
                    <input
                      type={getInputType(callback.type)}
                      id={input.name}
                      name={input.name}
                      class="tw_w-full tw_rounded tw_border tw_border-gray-300 tw_p-2 dark:tw_bg-gray-800 dark:tw_border-gray-600"
                      autocomplete={callback.type === 'PasswordCallback' ? 'current-password' : callback.type === 'NameCallback' ? 'username' : undefined}
                    />
                  {/if}
                </div>
              {/each}
            {/if}
          {/each}

          <!-- Submit button (not shown if ConfirmationCallback handles it) -->
          {#if !currentStep.callbacks.some((cb: { type: string }) => cb.type === 'ConfirmationCallback')}
            <button
              type="submit"
              class="tw_button-base tw_focusable-element dark:tw_focusable-element_dark tw_button-primary dark:tw_button-primary_dark tw_w-full tw_mt-4"
            >
              Next
            </button>
          {/if}
        </form>
      </div>
    {/if}
  </div>
</div>
