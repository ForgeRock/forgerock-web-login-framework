import type { ReCaptchaCallback } from '@forgerock/javascript-sdk';

/*
 * Because hcaptch and grecaptcha would
 * both be loaded on the page, we need to just leverage
 * the classnames to determine which one is being rendered.
 * This is retrieved from the step
 */
export function checkForHCaptcha(captchaClassname: string) {
  return captchaClassname.match('h-captcha');
}

export function renderCaptcha({
  nameOfCaptcha,
  siteKey,
}: {
  nameOfCaptcha: 'hcaptcha' | 'grecaptcha';
  siteKey: string;
}) {
  if (nameOfCaptcha === 'hcaptcha' && window.hcaptcha) {
    return window.hcaptcha.render('fr-recaptcha', {
      sitekey: siteKey,
      callback: 'frHandleCaptcha',
      'expired-callback': 'frHandleExpiredCallback',
      'chalexpired-callback': 'frHandleExpiredCallback',
      'error-callback': 'frHandleErrorCallback',
    });
  }
  if (nameOfCaptcha === 'grecaptcha' && window.grecaptcha) {
    return window.grecaptcha.render('fr-recaptcha', {
      sitekey: siteKey,
      callback: window.frHandleCaptcha, // grecaptcha uses different types so passing real function here
      'expired-callback': window.frHandleExpiredCallback,
    });
  }
}

export function handleCaptchaError(callback: ReCaptchaCallback) {
  const siteKey = callback?.getSiteKey() ?? '';
  const className: string =
    callback?.getOutputByName<string>('captchaDivClass', 'h-captcha') ?? 'h-captcha';

  if (checkForHCaptcha(className)) {
    return () => renderCaptcha({ nameOfCaptcha: 'hcaptcha', siteKey });
  } else {
    return () => renderCaptcha({ nameOfCaptcha: 'grecaptcha', siteKey });
  }
}

export function handleCaptchaToken(callback: ReCaptchaCallback) {
  return (token: string) => {
    callback?.setResult(token);
  };
}
