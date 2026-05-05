/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Resolves the active reCAPTCHA namespace. Prefers `grecaptcha.enterprise`
 * (loaded by enterprise.js) and falls back to the classic `grecaptcha` global
 * (loaded by api.js or auto-migrated keys). This makes all call sites
 * transparent to which script the consumer loaded.
 */
export function resolveGrecaptcha(): ReCaptchaV2.ReCaptcha {
  const grecaptcha = window.grecaptcha as ReCaptchaV2.ReCaptcha & {
    enterprise?: ReCaptchaV2.ReCaptcha;
  };
  return grecaptcha?.enterprise ?? window.grecaptcha;
}

/**
 * Injects a CAPTCHA script tag into <head> and resolves when the provider API
 * is ready to use. No-ops if the provider API is already present on window (e.g.
 * pre-loaded by consumer or stubbed in tests), or if a script with the same src
 * is already in the document. For grecaptcha, waits for grecaptcha.ready().
 */
export function loadCaptchaScript({
  src,
  provider,
}: {
  src: string;
  provider: 'grecaptcha' | 'hcaptcha';
}): Promise<void> {
  if (provider === 'hcaptcha') {
    const hc = (window as Window & { hcaptcha?: unknown }).hcaptcha;
    if (hc) return Promise.resolve();
  } else {
    const grc = resolveGrecaptcha();
    if (grc) return new Promise((resolve) => grc.ready(() => resolve()));
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      existing.addEventListener(
        'load',
        () => {
          if (provider === 'hcaptcha') {
            settle(resolve);
          } else {
            const grc2 = resolveGrecaptcha();
            settle(grc2 ? () => grc2.ready(() => resolve()) : resolve);
          }
        },
        { once: true },
      );
      existing.addEventListener(
        'error',
        () => settle(() => reject(new Error(`Failed to load CAPTCHA script: ${src}`))),
        { once: true },
      );

      // Double-check: provider may have initialized between querySelector and addEventListener
      if (provider === 'hcaptcha') {
        if ((window as Window & { hcaptcha?: unknown }).hcaptcha) settle(resolve);
      } else {
        const grc = resolveGrecaptcha();
        if (grc) settle(() => grc.ready(() => resolve()));
      }
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onerror = () => reject(new Error(`Failed to load CAPTCHA script: ${src}`));
    script.onload = () => {
      if (provider === 'hcaptcha') {
        resolve();
      } else {
        const grc = resolveGrecaptcha();
        grc ? grc.ready(() => resolve()) : resolve();
      }
    };
    document.head.appendChild(script);
  });
}

interface HCaptcha {
  render: (id: string, options: Record<string, unknown>) => void;
  execute: () => void;
}

const hcaptcha = () => (window as Window & { hcaptcha?: HCaptcha }).hcaptcha;

export function renderCaptcha({
  nameOfCaptcha,
  siteKey,
  elementId = 'fr-recaptcha',
  onSuccess,
  onExpired,
  onError,
}: {
  nameOfCaptcha: 'hcaptcha' | 'grecaptcha';
  siteKey: string;
  elementId?: string;
  onSuccess: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
}) {
  const hc = hcaptcha();
  if (nameOfCaptcha === 'hcaptcha' && hc) {
    return hc.render(elementId, {
      sitekey: siteKey,
      callback: onSuccess,
      'expired-callback': onExpired,
      'chalexpired-callback': onExpired,
      'error-callback': onError,
    });
  }
  const grc = resolveGrecaptcha();
  if (nameOfCaptcha === 'grecaptcha' && grc) {
    return grc.render(elementId, {
      sitekey: siteKey,
      callback: onSuccess,
      'expired-callback': onExpired,
    });
  }
}

export function renderCaptchaInvisible({
  nameOfCaptcha,
  siteKey,
  elementId,
  onSuccess,
  onExpired,
  onError,
}: {
  nameOfCaptcha: 'hcaptcha' | 'grecaptcha';
  siteKey: string;
  elementId: string;
  onSuccess: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
}) {
  const hc = hcaptcha();
  if (nameOfCaptcha === 'hcaptcha' && hc) {
    hc.render(elementId, {
      sitekey: siteKey,
      size: 'invisible',
      callback: onSuccess,
      'expired-callback': onExpired,
      'chalexpired-callback': onExpired,
      'error-callback': onError,
    });
    hc.execute();
    return;
  }
  const grc = resolveGrecaptcha();
  if (nameOfCaptcha === 'grecaptcha' && grc) {
    grc.ready(function () {
      const widgetId = grc.render(elementId, {
        sitekey: siteKey,
        size: 'invisible',
        callback: onSuccess,
        'expired-callback': onExpired,
        'error-callback': onError,
      });
      grc.execute(widgetId);
    });
  }
}
