<!--
@component
Type: stage
Name: UsernameAvatar

Demo: full custom username stage that fetches a profile picture when a known
username is typed and reveals it with a circular iris animation.
-->

<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    captureLinks,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
  } from '$login-framework';

  import type { FRStep } from '@forgerock/javascript-sdk';

  import type {
    CallbackMetadata,
    Maybe,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    StyleObject,
  } from '$login-framework';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: FRStep;

  interface EmailEntry {
    name: string;
    greeting?: string;
  }

  const VALID_EMAILS: Record<string, EmailEntry> = {
    'demo@example.com': { name: 'Demo' },
    'admin@example.com': { name: 'Admin' },
    'alice@example.com': { name: 'Alice' },
    'bob@example.com': { name: 'Bob' },
    'gabrielstein@pingidentity.com': { name: 'Gabriel' },
    'carol@example.com': { name: 'Carol' },
    'justin.lowery@pingidentity.com': { name: 'Justin', greeting: 'Hey hey hey,' },
    'ryan.basmajian@pingidentity.com': { name: 'Ryan' },
    'vatsalparikh@pingidentity.com': { name: 'Vatsal' },
    'ajancheta@pingidentity.com': { name: 'AJ' },
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((v) => (currentStyle = v));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper: HTMLElement;

  let avatarUrl: string | null = null;
  let avatarVisible = false;
  let avatarLoading = false;
  let lastCheckedUsername = '';
  let matchedUsername = '';
  let matchedGreeting = '';
  let emailError: string | null = null;
  let passwordFilled = false;

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  onMount(() => {
    if (componentStyle === 'modal') {
      captureLinks(linkWrapper, journey);
    }
    watchUsernameInput();
  });

  onDestroy(() => {
    stopWatchingUsername();
  });

  let inputObserver: MutationObserver | null = null;
  let inputEl: HTMLInputElement | null = null;
  let inputListener: ((e: Event) => void) | null = null;
  let passwordEl: HTMLInputElement | null = null;
  let passwordListener: ((e: Event) => void) | null = null;

  function watchUsernameInput() {
    // Poll briefly for the input rendered by CallbackMapper, then attach listener.
    const poll = setInterval(() => {
      const found = document.querySelector<HTMLInputElement>(
        'input[type="text"], input:not([type])',
      );
      if (found) {
        clearInterval(poll);
        inputEl = found;
        inputListener = (e: Event) => handleUsernameInput((e.target as HTMLInputElement).value);
        inputEl.addEventListener('input', inputListener);
      }
    }, 50);

    // Give up after 3s if no input found.
    setTimeout(() => clearInterval(poll), 3000);
  }

  function stopWatchingUsername() {
    if (inputEl && inputListener) {
      inputEl.removeEventListener('input', inputListener);
    }
    if (passwordEl && passwordListener) {
      passwordEl.removeEventListener('input', passwordListener);
    }
    if (inputObserver) {
      inputObserver.disconnect();
    }
  }

  function watchPasswordInput() {
    const poll = setInterval(() => {
      const found = document.querySelector<HTMLInputElement>('input[type="password"]');
      if (found) {
        clearInterval(poll);
        passwordEl = found;
        passwordListener = (e: Event) => {
          passwordFilled = !!(e.target as HTMLInputElement).value;
        };
        passwordEl.addEventListener('input', passwordListener);
      }
    }, 50);
    setTimeout(() => clearInterval(poll), 3000);
  }

  async function handleUsernameInput(value: string) {
    const username = value.trim().toLowerCase();

    if (username === lastCheckedUsername) return;
    lastCheckedUsername = username;

    // Clear everything when field is empty.
    if (!username) {
      avatarUrl = null;
      avatarVisible = false;
      avatarLoading = false;
      matchedUsername = '';
      matchedGreeting = '';
      passwordFilled = false;
      emailError = null;
      return;
    }

    // Show format error only once the input looks like the user is done typing.
    if (!EMAIL_REGEX.test(username)) {
      avatarUrl = null;
      avatarVisible = false;
      avatarLoading = false;
      matchedUsername = '';
      passwordFilled = false;
      emailError = 'Please enter a valid email address.';
      return;
    }

    emailError = null;

    const entry = VALID_EMAILS[username];
    const displayName = entry?.name;

    if (!displayName) {
      avatarUrl = null;
      avatarVisible = false;
      avatarLoading = false;
      matchedUsername = '';
      matchedGreeting = '';
      passwordFilled = false;
      return;
    }

    avatarLoading = true;
    avatarVisible = false;
    avatarUrl = null;

    // i.pravatar.cc has 70 numbered photos — pick one at random each match.
    const randomIndex = Math.floor(Math.random() * 70) + 1;
    const url = `https://i.pravatar.cc/150?img=${randomIndex}`;

    try {
      await preloadImage(url);
      avatarUrl = url;
      matchedUsername = displayName;
      matchedGreeting = entry?.greeting ?? '';
      avatarLoading = false;
      // Tiny delay lets the DOM paint the element before the animation class kicks in.
      requestAnimationFrame(() => {
        avatarVisible = true;
      });
    } catch {
      avatarUrl = null;
      avatarLoading = false;
      avatarVisible = false;
    }
  }

  function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = src;
    });
  }

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }

  $: if (avatarVisible) {
    // Password field just mounted — start watching it.
    passwordFilled = false;
    watchPasswordInput();
  }
</script>

<Form bind:formEl ariaDescribedBy="avatarFormFailureAlert" onSubmitWhenValid={form?.submit}>
  <div class="stage-wrapper">
    {#if componentStyle !== 'inline'}
      <div class="header-section">
        <div class="avatar-area">
          {#if avatarLoading}
            <div class="avatar-skeleton" aria-hidden="true">
              <div class="skeleton-shimmer" />
            </div>
          {:else if avatarUrl && avatarVisible}
            <div class="avatar-ring">
              <img src={avatarUrl} alt="Profile" class="avatar-img iris-reveal" />
            </div>
            <div class="avatar-glow" aria-hidden="true" />
          {:else}
            <div class="avatar-placeholder" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="placeholder-icon"
              >
                <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.6" />
                <path
                  d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  opacity="0.4"
                />
              </svg>
            </div>
          {/if}
        </div>

        <h1 class="welcome-heading">
          {#if avatarUrl && avatarVisible}
            {matchedGreeting || interpolate('welcomeBack', null, 'Welcome back,')}
            <span class="username-highlight">{matchedUsername}</span>
          {:else}
            {interpolate('signIn', null, 'Sign in')}
          {/if}
        </h1>
        <p class="welcome-sub">
          {interpolate('enterCredentials', null, 'Enter your username to continue')}
        </p>
      </div>
    {/if}

    {#if form?.message}
      <Alert id="avatarFormFailureAlert" needsFocus={alertNeedsFocus} type="error">
        {interpolate(formMessageKey, null, form?.message)}
      </Alert>
    {/if}

    <div class="dynamic-section">
      <div class="callbacks-section">
        {#each step?.callbacks as callback, idx}
          {#if callback.getType() === 'PasswordCallback'}
            {#if avatarVisible}
              <div class="password-reveal">
                <CallbackMapper
                  props={{
                    callback,
                    callbackMetadata: metadata?.callbacks[idx],
                    selfSubmitFunction: determineSubmission,
                    stepMetadata: metadata?.step && { ...metadata.step },
                    style: currentStyle,
                  }}
                />
              </div>
            {/if}
          {:else}
            <CallbackMapper
              props={{
                callback,
                callbackMetadata: metadata?.callbacks[idx],
                selfSubmitFunction: determineSubmission,
                stepMetadata: metadata?.step && { ...metadata.step },
                style: currentStyle,
              }}
            />
          {/if}
        {/each}
      </div>

      {#if emailError}
        <p class="email-error" role="alert">{emailError}</p>
      {:else if !avatarVisible && !avatarLoading}
        <p class="input-hint">Enter your email to continue</p>
      {/if}
    </div>

    {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
      <button
        class="next-button"
        type="submit"
        disabled={journey?.loading || !avatarVisible || !passwordFilled}
      >
        {#if journey?.loading}
          <span class="btn-spinner" aria-hidden="true" />
        {:else}
          {interpolate('next', null, 'Next')}
        {/if}
      </button>
    {/if}

    {#if componentStyle !== 'inline'}
      <div bind:this={linkWrapper} class="footer-links">
        <p class="footer-text"></p>
      </div>
    {/if}
  </div>
</Form>

<style>
  .stage-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background: linear-gradient(145deg, #0f0c29, #302b63, #24243e);
    border-radius: 1.25rem;
    padding: 2rem 1.75rem;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06),
      0 24px 48px rgba(0, 0, 0, 0.5);
    color: #f0f0f5;
    min-width: 320px;
    max-width: 420px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
  }

  /* ── Avatar area ── */
  .avatar-area {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    border: 2px dashed rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.3);
  }

  .placeholder-icon {
    width: 48px;
    height: 48px;
  }

  .avatar-skeleton {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
  }

  .skeleton-shimmer {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.12) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .avatar-ring {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  /* Iris/circular wipe reveal — clips from circle(0%) to circle(55%) */
  @keyframes irisReveal {
    0% {
      clip-path: circle(0% at 50% 50%);
      opacity: 0.2;
    }
    60% {
      clip-path: circle(58% at 50% 50%);
      opacity: 1;
    }
    80% {
      clip-path: circle(52% at 50% 50%);
    }
    100% {
      clip-path: circle(55% at 50% 50%);
      opacity: 1;
    }
  }

  .iris-reveal {
    animation: irisReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* Subtle ambient glow that fades in after the reveal */
  .avatar-glow {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%);
    animation: glowFadeIn 0.8s 0.4s ease-out both;
    pointer-events: none;
  }

  @keyframes glowFadeIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* ── Typography ── */
  .welcome-heading {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
    margin: 0;
    transition: opacity 0.3s ease;
  }

  .username-highlight {
    background: linear-gradient(90deg, #a855f7, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fadeSlideIn 0.4s ease-out both;
  }

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .welcome-sub {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  /* ── Dynamic section (min-height prevents layout shift; overflow handled per-child) ── */
  .dynamic-section {
    min-height: 130px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.5rem;
  }

  /* ── Callbacks ── */
  .callbacks-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* ── Password reveal ── */
  .password-reveal {
    animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    overflow: hidden;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-12px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 200px;
    }
  }

  /* ── Input hint ── */
  .input-hint {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.3);
    margin: 0;
    text-align: center;
    font-style: italic;
  }

  /* ── Email validation error ── */
  .email-error {
    font-size: 0.8125rem;
    color: #f87171;
    margin: 0;
    padding: 0.5rem 0.75rem;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.25);
    border-radius: 0.5rem;
    animation: fadeSlideIn 0.2s ease-out both;
  }

  /* ── Next button ── */
  .next-button {
    width: 100%;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.625rem;
    background: linear-gradient(135deg, #a855f7, #3b82f6);
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      opacity 0.15s ease;
    box-shadow: 0 4px 20px rgba(168, 85, 247, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
  }

  .next-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(168, 85, 247, 0.5);
  }

  .next-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .next-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ── Footer ── */
  .footer-links {
    text-align: center;
  }

  .footer-text {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.35);
    margin: 0;
  }
</style>
