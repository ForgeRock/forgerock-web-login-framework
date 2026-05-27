/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadCaptchaScript,
  renderCaptcha,
  renderCaptchaInvisible,
  resolveGrecaptcha,
} from './captcha.effects';

vi.stubGlobal('window', globalThis);

describe('resolveGrecaptcha', () => {
  beforeEach(() => {
    vi.stubGlobal('grecaptcha', undefined);
  });

  it('returns grecaptcha.enterprise when enterprise namespace is present', () => {
    const enterprise = { ready: vi.fn(), render: vi.fn(), execute: vi.fn() };
    vi.stubGlobal('grecaptcha', { enterprise });
    expect(resolveGrecaptcha()).toBe(enterprise);
  });

  it('falls back to window.grecaptcha when enterprise namespace is absent', () => {
    const classic = { ready: vi.fn(), render: vi.fn(), execute: vi.fn() };
    vi.stubGlobal('grecaptcha', classic);
    expect(resolveGrecaptcha()).toBe(classic);
  });
});

describe('loadCaptchaScript', () => {
  let appendedScript: {
    src: string;
    async: boolean;
    onload: (() => void) | null;
    onerror: (() => void) | null;
  };
  let mockQuerySelector: ReturnType<typeof vi.fn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('grecaptcha', undefined);
    appendedScript = { src: '', async: false, onload: null, onerror: null };
    mockAppendChild = vi.fn();
    mockQuerySelector = vi.fn().mockReturnValue(null);
    vi.stubGlobal('document', {
      querySelector: mockQuerySelector,
      createElement: () => appendedScript,
      head: { appendChild: mockAppendChild },
    });
  });

  it('injects a new script tag and resolves on load for hcaptcha', async () => {
    const promise = loadCaptchaScript({
      src: 'https://js.hcaptcha.com/1/api.js',
      provider: 'hcaptcha',
    });
    expect(appendedScript.src).toBe('https://js.hcaptcha.com/1/api.js');
    expect(mockAppendChild).toHaveBeenCalledOnce();
    appendedScript.onload?.();
    await promise;
  });

  it('injects a new script tag and waits for grecaptcha.ready on load', async () => {
    const mockReady = vi.fn((fn: () => void) => fn());
    const promise = loadCaptchaScript({
      src: 'https://www.google.com/recaptcha/api.js',
      provider: 'grecaptcha',
    });
    expect(appendedScript.src).toBe('https://www.google.com/recaptcha/api.js');
    vi.stubGlobal('grecaptcha', { ready: mockReady });
    appendedScript.onload?.();
    await promise;
    expect(mockReady).toHaveBeenCalledOnce();
  });

  it('reuses existing hcaptcha script and resolves on load event', async () => {
    const listeners: Record<string, () => void> = {};
    mockQuerySelector.mockReturnValue({
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
    });
    const promise = loadCaptchaScript({
      src: 'https://js.hcaptcha.com/1/api.js',
      provider: 'hcaptcha',
    });
    expect(mockAppendChild).not.toHaveBeenCalled();
    listeners['load']?.();
    await promise;
  });

  it('reuses existing hcaptcha script and rejects on error event', async () => {
    const listeners: Record<string, () => void> = {};
    mockQuerySelector.mockReturnValue({
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
    });
    const promise = loadCaptchaScript({
      src: 'https://js.hcaptcha.com/1/api.js',
      provider: 'hcaptcha',
    });
    listeners['error']?.();
    await expect(promise).rejects.toThrow('Failed to load CAPTCHA script');
  });

  it('reuses existing grecaptcha script and calls ready when grecaptcha already present', async () => {
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', { ready: mockReady });
    const listeners: Record<string, () => void> = {};
    mockQuerySelector.mockReturnValue({
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
    });
    await loadCaptchaScript({
      src: 'https://www.google.com/recaptcha/api.js',
      provider: 'grecaptcha',
    });
    expect(mockAppendChild).not.toHaveBeenCalled();
    expect(mockReady).toHaveBeenCalledOnce();
  });

  it('reuses existing grecaptcha script and waits for load then ready when not yet initialized', async () => {
    const mockReady = vi.fn((fn: () => void) => fn());
    const listeners: Record<string, () => void> = {};
    mockQuerySelector.mockReturnValue({
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
    });
    const promise = loadCaptchaScript({
      src: 'https://www.google.com/recaptcha/api.js',
      provider: 'grecaptcha',
    });
    expect(mockAppendChild).not.toHaveBeenCalled();
    vi.stubGlobal('grecaptcha', { ready: mockReady });
    listeners['load']?.();
    await promise;
    expect(mockReady).toHaveBeenCalledOnce();
  });

  it('rejects when the script fails to load', async () => {
    const promise = loadCaptchaScript({
      src: 'https://bad.example.com/api.js',
      provider: 'hcaptcha',
    });
    appendedScript.onerror?.();
    await expect(promise).rejects.toThrow('Failed to load CAPTCHA script');
  });
});

const makeCallbacks = () => ({
  onSuccess: vi.fn(),
  onExpired: vi.fn(),
  onError: vi.fn(),
});

describe('renderCaptcha (visible mode)', () => {
  beforeEach(() => {
    vi.stubGlobal('hcaptcha', undefined);
    vi.stubGlobal('grecaptcha', undefined);
  });

  it('should call hcaptcha.render when provider is hcaptcha and window.hcaptcha is available', () => {
    const mockRender = vi.fn().mockReturnValue('widget-id-1');
    vi.stubGlobal('hcaptcha', { render: mockRender });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptcha({
      nameOfCaptcha: 'hcaptcha',
      siteKey: 'hcaptcha-site-key',
      elementId: 'fr-hcaptcha',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockRender).toHaveBeenCalledWith('fr-hcaptcha', {
      sitekey: 'hcaptcha-site-key',
      callback: onSuccess,
      'expired-callback': onExpired,
      'chalexpired-callback': onExpired,
      'error-callback': onError,
    });
  });

  it('should call grecaptcha.render when provider is grecaptcha and window.grecaptcha is available', () => {
    const mockRender = vi.fn().mockReturnValue('widget-id-2');
    vi.stubGlobal('grecaptcha', { render: mockRender });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptcha({
      nameOfCaptcha: 'grecaptcha',
      siteKey: 'grecaptcha-site-key',
      elementId: 'fr-recaptcha',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockRender).toHaveBeenCalledWith('fr-recaptcha', {
      sitekey: 'grecaptcha-site-key',
      callback: onSuccess,
      'expired-callback': onExpired,
    });
  });

  it('should not throw if hcaptcha is not loaded', () => {
    const { onSuccess, onExpired, onError } = makeCallbacks();
    expect(() =>
      renderCaptcha({ nameOfCaptcha: 'hcaptcha', siteKey: 'key', onSuccess, onExpired, onError }),
    ).not.toThrow();
  });

  it('should not throw if grecaptcha is not loaded', () => {
    const { onSuccess, onExpired, onError } = makeCallbacks();
    expect(() =>
      renderCaptcha({ nameOfCaptcha: 'grecaptcha', siteKey: 'key', onSuccess, onExpired, onError }),
    ).not.toThrow();
  });
});

describe('renderCaptchaInvisible (invisible mode)', () => {
  beforeEach(() => {
    vi.stubGlobal('hcaptcha', undefined);
    vi.stubGlobal('grecaptcha', undefined);
  });

  it('should render and execute hcaptcha invisible when window.hcaptcha is available', () => {
    const mockRender = vi.fn();
    const mockExecute = vi.fn();
    vi.stubGlobal('hcaptcha', { render: mockRender, execute: mockExecute });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptchaInvisible({
      nameOfCaptcha: 'hcaptcha',
      siteKey: 'hcaptcha-site-key',
      elementId: 'fr-hcaptcha',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockRender).toHaveBeenCalledWith('fr-hcaptcha', {
      sitekey: 'hcaptcha-site-key',
      size: 'invisible',
      callback: onSuccess,
      'expired-callback': onExpired,
      'chalexpired-callback': onExpired,
      'error-callback': onError,
    });
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it('should render and execute grecaptcha invisible when window.grecaptcha is available', () => {
    const mockRender = vi.fn().mockReturnValue('widget-id-invisible');
    const mockExecute = vi.fn();
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', { ready: mockReady, render: mockRender, execute: mockExecute });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptchaInvisible({
      nameOfCaptcha: 'grecaptcha',
      siteKey: 'grecaptcha-site-key',
      elementId: 'fr-recaptcha',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockReady).toHaveBeenCalledOnce();
    expect(mockRender).toHaveBeenCalledWith('fr-recaptcha', {
      sitekey: 'grecaptcha-site-key',
      size: 'invisible',
      callback: onSuccess,
      'expired-callback': onExpired,
      'error-callback': onError,
    });
    expect(mockExecute).toHaveBeenCalledWith('widget-id-invisible');
  });

  it('should not throw if hcaptcha is not loaded', () => {
    const { onSuccess, onExpired, onError } = makeCallbacks();
    expect(() =>
      renderCaptchaInvisible({
        nameOfCaptcha: 'hcaptcha',
        siteKey: 'key',
        elementId: 'fr-hcaptcha',
        onSuccess,
        onExpired,
        onError,
      }),
    ).not.toThrow();
  });

  it('should not throw if grecaptcha is not loaded', () => {
    const { onSuccess, onExpired, onError } = makeCallbacks();
    expect(() =>
      renderCaptchaInvisible({
        nameOfCaptcha: 'grecaptcha',
        siteKey: 'key',
        elementId: 'fr-recaptcha',
        onSuccess,
        onExpired,
        onError,
      }),
    ).not.toThrow();
  });
});

describe('renderCaptcha — Enterprise namespace', () => {
  beforeEach(() => {
    vi.stubGlobal('grecaptcha', undefined);
  });

  it('calls enterprise.render when grecaptcha.enterprise is present', () => {
    const mockRender = vi.fn().mockReturnValue('enterprise-widget-id');
    vi.stubGlobal('grecaptcha', { enterprise: { render: mockRender } });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptcha({
      nameOfCaptcha: 'grecaptcha',
      siteKey: 'enterprise-site-key',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockRender).toHaveBeenCalledWith('fr-recaptcha', {
      sitekey: 'enterprise-site-key',
      callback: onSuccess,
      'expired-callback': onExpired,
    });
  });

  it('calls classic render when enterprise namespace is absent', () => {
    const mockRender = vi.fn().mockReturnValue('classic-widget-id');
    vi.stubGlobal('grecaptcha', { render: mockRender });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptcha({
      nameOfCaptcha: 'grecaptcha',
      siteKey: 'classic-site-key',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockRender).toHaveBeenCalledWith('fr-recaptcha', {
      sitekey: 'classic-site-key',
      callback: onSuccess,
      'expired-callback': onExpired,
    });
  });
});

describe('renderCaptchaInvisible — Enterprise namespace', () => {
  beforeEach(() => {
    vi.stubGlobal('grecaptcha', undefined);
  });

  it('calls enterprise.ready/render/execute when enterprise namespace is present', () => {
    const mockRender = vi.fn().mockReturnValue('enterprise-invisible-id');
    const mockExecute = vi.fn();
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', {
      enterprise: { ready: mockReady, render: mockRender, execute: mockExecute },
    });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptchaInvisible({
      nameOfCaptcha: 'grecaptcha',
      siteKey: 'enterprise-site-key',
      elementId: 'fr-recaptcha',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockReady).toHaveBeenCalledOnce();
    expect(mockRender).toHaveBeenCalledWith('fr-recaptcha', {
      sitekey: 'enterprise-site-key',
      size: 'invisible',
      callback: onSuccess,
      'expired-callback': onExpired,
      'error-callback': onError,
    });
    expect(mockExecute).toHaveBeenCalledWith('enterprise-invisible-id');
  });

  it('falls back to classic ready/render/execute when enterprise namespace is absent', () => {
    const mockRender = vi.fn().mockReturnValue('classic-invisible-id');
    const mockExecute = vi.fn();
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', { ready: mockReady, render: mockRender, execute: mockExecute });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderCaptchaInvisible({
      nameOfCaptcha: 'grecaptcha',
      siteKey: 'classic-site-key',
      elementId: 'fr-recaptcha',
      onSuccess,
      onExpired,
      onError,
    });

    expect(mockReady).toHaveBeenCalledOnce();
    expect(mockRender).toHaveBeenCalledWith('fr-recaptcha', {
      sitekey: 'classic-site-key',
      size: 'invisible',
      callback: onSuccess,
      'expired-callback': onExpired,
      'error-callback': onError,
    });
    expect(mockExecute).toHaveBeenCalledWith('classic-invisible-id');
  });
});
