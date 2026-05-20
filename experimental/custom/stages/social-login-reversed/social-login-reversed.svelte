<!--
@component
Type: stage
Name: SocialLoginReversed

Demo stage: credentials-first layout with animated background, particle
bursts, a live "breach check" fetch, and staggered social button reveals.
Set the Stage field on your AM Page Node to "SocialLoginReversed".
-->

<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';

  import Alert from '$components/primitives/alert/alert.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { styleStore } from '$core/style.store';
  import CallbackMapper from '$journey/_utilities/callback-mapper.svelte';
  import { captureLinks } from '$journey/stages/_utilities/stage.utilities';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
  } from '$journey/journey.interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper: HTMLElement;

  // ── Particle canvas ──────────────────────────────────────────────────────
  let canvas: HTMLCanvasElement;
  let animFrame: number;

  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    alpha: number;
    color: string;
  };

  const COLORS = ['#a855f7', '#6366f1', '#3b82f6', '#06b6d4', '#f472b6'];
  let particles: Particle[] = [];

  function spawnParticles(n = 18) {
    const w = canvas?.width ?? 400;
    const h = canvas?.height ?? 500;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  }

  function burstParticles(x: number, y: number) {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 3 + 1,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  }

  function drawLoop() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((p) => p.alpha > 0.02);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.alpha *= 0.985;
    }
    ctx.globalAlpha = 1;
    animFrame = requestAnimationFrame(drawLoop);
  }

  // ── Breach check (fetch demo) ─────────────────────────────────────────────
  let breachStatus: 'idle' | 'checking' | 'safe' | 'warning' = 'idle';
  let breachDebounce: ReturnType<typeof setTimeout>;

  async function checkPasswordStrength(value: string) {
    if (!value || value.length < 4) {
      breachStatus = 'idle';
      return;
    }
    breachStatus = 'checking';
    clearTimeout(breachDebounce);
    breachDebounce = setTimeout(async () => {
      try {
        // k-anonymity: only send first 5 chars of SHA-1 — no actual password leaves the browser
        const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
        const hex = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        const prefix = hex.slice(0, 5);
        const suffix = hex.slice(5);
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await res.text();
        const found = text.split('\n').some((line) => line.startsWith(suffix));
        breachStatus = found ? 'warning' : 'safe';
        if (!found) burstParticles((canvas?.width ?? 400) / 2, canvas?.height ?? 400);
      } catch {
        breachStatus = 'idle';
      }
    }, 600);
  }

  // ── Staggered social reveal ───────────────────────────────────────────────
  let socialVisible = false;
  let socialRevealTimer: ReturnType<typeof setTimeout>;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  onMount(() => {
    if (componentStyle === 'modal') captureLinks(linkWrapper, journey);
    const bg = 'linear-gradient(145deg, #0f0c29, #302b63, #24243e)';
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
    const rootEl = document.querySelector<HTMLElement>('.root');
    if (rootEl) rootEl.style.background = bg;
    document.documentElement.classList.add('social-login-reversed-active');
    document.body.classList.add('social-login-reversed-active');

    if (canvas) {
      const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      spawnParticles(30);
      drawLoop();
    }

    // Attach password input listener for breach check
    const poll = setInterval(() => {
      const pwInput = document.querySelector<HTMLInputElement>('input[type="password"]');
      if (pwInput) {
        clearInterval(poll);
        pwInput.addEventListener('input', (e) =>
          checkPasswordStrength((e.target as HTMLInputElement).value),
        );
      }
    }, 100);
    setTimeout(() => clearInterval(poll), 3000);

    // Stagger social buttons in after a beat
    socialRevealTimer = setTimeout(() => {
      socialVisible = true;
    }, 400);
  });

  onDestroy(() => {
    document.documentElement.style.background = '';
    document.body.style.background = '';
    const rootEl = document.querySelector<HTMLElement>('.root');
    if (rootEl) rootEl.style.background = '';
    document.documentElement.classList.remove('social-login-reversed-active');
    document.body.classList.remove('social-login-reversed-active');
    cancelAnimationFrame(animFrame);
    clearTimeout(breachDebounce);
    clearTimeout(socialRevealTimer);
  });

  $: formMessageKey = convertStringToKey(form?.message);
  $: indexedCallbacks = (step?.callbacks ?? []).map((cb, idx) => ({ cb, idx }));
  $: credentialEntries = indexedCallbacks.filter((e) => e.cb.payload?.type !== 'SelectIdPCallback');
  $: socialEntries = indexedCallbacks.filter((e) => e.cb.payload?.type === 'SelectIdPCallback');
</script>

<div class="stage-shell">
  <canvas bind:this={canvas} class="particle-canvas" aria-hidden="true"></canvas>

  <div class="card">
    <div class="card-header">
      <div class="logo-ring">
        <svg viewBox="0 0 24 24" fill="none" class="shield-icon">
          <path
            d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
            fill="url(#shieldGrad)"
            opacity="0.9"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="#fff"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <defs>
            <linearGradient
              id="shieldGrad"
              x1="4"
              y1="2"
              x2="20"
              y2="23"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stop-color="#a855f7" />
              <stop offset="100%" stop-color="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h1 class="card-title">{interpolate('signIn', null, 'Welcome back')}</h1>
      <p class="card-sub">{interpolate('enterCredentials', null, 'Sign in to continue')}</p>
    </div>

    <Form bind:formEl ariaDescribedBy="slr-alert" onSubmitWhenValid={form?.submit}>
      {#if form?.message}
        <Alert id="slr-alert" needsFocus={alertNeedsFocus} type="error">
          {interpolate(formMessageKey, null, form?.message)}
        </Alert>
      {/if}

      <div class="fields-section">
        {#each credentialEntries as { cb, idx }}
          <div class="field-row">
            <CallbackMapper
              props={{
                callback: cb,
                callbackMetadata: metadata?.callbacks[idx],
                selfSubmitFunction: determineSubmission,
                stepMetadata: metadata?.step && { ...metadata.step },
                style: $styleStore,
              }}
            />
          </div>
        {/each}

        {#if breachStatus !== 'idle'}
          <div class="breach-badge breach-badge--{breachStatus}">
            {#if breachStatus === 'checking'}
              <span class="breach-spinner"></span> Checking password safety…
            {:else if breachStatus === 'safe'}
              ✦ Password looks great!
            {:else if breachStatus === 'warning'}
              ⚠ This password has appeared in data breaches
            {/if}
          </div>
        {/if}
      </div>

      {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
        <button class="submit-btn" type="submit" disabled={journey?.loading}>
          {#if journey?.loading}
            <span class="btn-spinner"></span>
          {:else}
            {interpolate('next', null, 'Continue')}
            <svg class="arrow-icon" viewBox="0 0 20 20" fill="currentColor"
              ><path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              /></svg
            >
          {/if}
        </button>
      {/if}

      {#if socialEntries.length > 0}
        <div class="divider">
          <span>or continue with</span>
        </div>

        <div class="social-grid" class:social-grid--visible={socialVisible}>
          {#each socialEntries as { cb, idx }, i}
            <div class="social-item" style="--delay: {i * 80}ms">
              <CallbackMapper
                props={{
                  callback: cb,
                  callbackMetadata: metadata?.callbacks[idx],
                  selfSubmitFunction: determineSubmission,
                  stepMetadata: metadata?.step && { ...metadata.step },
                  style: $styleStore,
                }}
              />
            </div>
          {/each}
        </div>
      {/if}

      {#if componentStyle !== 'inline'}
        <div bind:this={linkWrapper}></div>
      {/if}
    </Form>
  </div>
</div>

<style>
  /* ── Shell & canvas ─────────────────────────────────────── */
  .stage-shell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .particle-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* ── Card ────────────────────────────────────────────────── */
  .card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
    margin: 0;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 1.5rem;
    padding: 2.25rem 2rem;
    box-shadow:
      0 0 0 1px rgba(168, 85, 247, 0.15),
      0 32px 64px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes cardEntrance {
    from {
      opacity: 0;
      transform: translateY(32px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* ── Header ─────────────────────────────────────────────── */
  .card-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.75rem;
    text-align: center;
  }

  .logo-ring {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2));
    border: 1px solid rgba(168, 85, 247, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.25rem;
    animation: pulseRing 3s ease-in-out infinite;
  }

  @keyframes pulseRing {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.3);
    }
    50% {
      box-shadow: 0 0 0 12px rgba(168, 85, 247, 0);
    }
  }

  .shield-icon {
    width: 32px;
    height: 32px;
  }

  .card-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .card-sub {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.55);
    margin: 0;
  }

  /* ── Fields ─────────────────────────────────────────────── */
  .fields-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .field-row {
    animation: fieldSlideIn 0.4s ease both;
  }

  .field-row:nth-child(1) {
    animation-delay: 0.1s;
  }
  .field-row:nth-child(2) {
    animation-delay: 0.2s;
  }

  @keyframes fieldSlideIn {
    from {
      opacity: 0;
      transform: translateX(-12px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* ── Breach badge ────────────────────────────────────────── */
  .breach-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-weight: 500;
    animation: fadeIn 0.3s ease both;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .breach-badge--checking {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .breach-badge--safe {
    background: rgba(16, 185, 129, 0.15);
    color: #6ee7b7;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .breach-badge--warning {
    background: rgba(245, 158, 11, 0.15);
    color: #fcd34d;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .breach-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(165, 180, 252, 0.3);
    border-top-color: #a5b4fc;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ── Submit button ───────────────────────────────────────── */
  .submit-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #a855f7, #6366f1, #3b82f6);
    background-size: 200% 200%;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 48px;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      opacity 0.15s ease;
    box-shadow: 0 4px 24px rgba(168, 85, 247, 0.4);
    animation: gradientShift 4s ease infinite;
    margin-bottom: 1.25rem;
  }

  @keyframes gradientShift {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(168, 85, 247, 0.55);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .arrow-icon {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
  }

  .submit-btn:hover .arrow-icon {
    transform: translateX(3px);
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

  /* ── Divider ─────────────────────────────────────────────── */
  .divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* ── Social grid ─────────────────────────────────────────── */
  .social-grid {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .social-item {
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 0.35s ease var(--delay, 0ms),
      transform 0.35s ease var(--delay, 0ms);
  }

  .social-grid--visible .social-item {
    opacity: 1;
    transform: translateY(0);
  }

  /* Hide the separator hr rendered by SelectIdPCallback */
  :global(body.social-login-reversed-active .card hr.tw_border-0) {
    display: none !important;
  }

  /* Neutralize the Box wrapper while this stage is mounted */
  :global(body.social-login-reversed-active > div),
  :global(body.social-login-reversed-active .tw_bg-body-light),
  :global(body.social-login-reversed-active .tw_bg-body-dark),
  :global(body.social-login-reversed-active .tw_containing-box),
  :global(body.social-login-reversed-active .tw_containing-box_dark),
  :global(body.social-login-reversed-active [class*='tw_containing-box']) {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    min-height: unset !important;
  }
</style>
