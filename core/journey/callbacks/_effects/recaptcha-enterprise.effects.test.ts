/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeEnterpriseCaptcha, renderEnterpriseCaptcha } from './recaptcha-enterprise.effects';

import type { ReCaptchaEnterpriseCallback } from '@forgerock/journey-client/types';

vi.stubGlobal('window', globalThis);

const makeCallbacks = () => ({
  onSuccess: vi.fn(),
  onExpired: vi.fn(),
  onError: vi.fn(),
});

describe('renderEnterpriseCaptcha', () => {
  beforeEach(() => {
    vi.stubGlobal('grecaptcha', undefined);
  });

  it('calls grecaptcha.render with closure callbacks', () => {
    const mockRender = vi.fn().mockReturnValue('grecaptcha-widget-id');
    vi.stubGlobal('grecaptcha', { render: mockRender });
    const { onSuccess, onExpired } = makeCallbacks();

    renderEnterpriseCaptcha({
      siteKey: 'grecaptcha-key',
      onSuccess,
      onExpired,
    });

    expect(mockRender).toHaveBeenCalledWith('fr-recaptcha-enterprise', {
      sitekey: 'grecaptcha-key',
      callback: onSuccess,
      'expired-callback': onExpired,
    });
  });

  it('calls enterprise.render when enterprise namespace present', () => {
    const mockRender = vi.fn().mockReturnValue('enterprise-widget-id');
    vi.stubGlobal('grecaptcha', { enterprise: { render: mockRender } });
    const { onSuccess, onExpired } = makeCallbacks();

    renderEnterpriseCaptcha({
      siteKey: 'enterprise-key',
      onSuccess,
      onExpired,
    });

    expect(mockRender).toHaveBeenCalledWith(
      'fr-recaptcha-enterprise',
      expect.objectContaining({ sitekey: 'enterprise-key' }),
    );
  });

  it('does not throw if grecaptcha is not loaded', () => {
    const { onSuccess, onExpired } = makeCallbacks();
    expect(() =>
      renderEnterpriseCaptcha({
        siteKey: 'key',
        onSuccess,
        onExpired,
      }),
    ).not.toThrow();
  });

  it('passes onError callback to grecaptcha.render', () => {
    const mockRender = vi.fn().mockReturnValue('widget-id');
    vi.stubGlobal('grecaptcha', { render: mockRender });
    const { onSuccess, onExpired, onError } = makeCallbacks();

    renderEnterpriseCaptcha({ siteKey: 'key', onSuccess, onExpired, onError });

    expect(mockRender).toHaveBeenCalledWith(
      'fr-recaptcha-enterprise',
      expect.objectContaining({ 'error-callback': onError }),
    );
  });
});

describe('executeEnterpriseCaptcha', () => {
  beforeEach(() => {
    vi.stubGlobal('grecaptcha', undefined);
  });

  it('calls setResult and setAction on success', async () => {
    const token = 'enterprise-token-xyz';
    const mockExecute = vi.fn().mockResolvedValue(token);
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', {
      enterprise: { ready: mockReady, execute: mockExecute },
    });

    const callback = {
      setResult: vi.fn(),
      setAction: vi.fn(),
      setClientError: vi.fn(),
    } as unknown as ReCaptchaEnterpriseCallback;
    executeEnterpriseCaptcha({ siteKey: 'site-key', action: 'LOGIN', callback });

    await vi.waitFor(() => expect(callback.setResult).toHaveBeenCalledWith(token));
    expect(callback.setAction).toHaveBeenCalledWith('LOGIN');
    expect(callback.setClientError).not.toHaveBeenCalled();
  });

  it('calls setClientError and onError on execute failure', async () => {
    const mockExecute = vi.fn().mockRejectedValue(new Error('network error'));
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', {
      enterprise: { ready: mockReady, execute: mockExecute },
    });

    const callback = {
      setResult: vi.fn(),
      setAction: vi.fn(),
      setClientError: vi.fn(),
    } as unknown as ReCaptchaEnterpriseCallback;
    const onError = vi.fn();
    executeEnterpriseCaptcha({ siteKey: 'site-key', action: 'LOGIN', callback, onError });

    await vi.waitFor(() => expect(callback.setClientError).toHaveBeenCalledWith('captcha_error'));
    expect(callback.setResult).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
  });

  it('does nothing when action is empty', () => {
    const mockReady = vi.fn();
    vi.stubGlobal('grecaptcha', { enterprise: { ready: mockReady } });

    const callback = {
      setResult: vi.fn(),
      setAction: vi.fn(),
      setClientError: vi.fn(),
    } as unknown as ReCaptchaEnterpriseCallback;
    executeEnterpriseCaptcha({ siteKey: 'site-key', action: '', callback });

    expect(mockReady).not.toHaveBeenCalled();
  });

  it('uses classic grecaptcha fallback when enterprise namespace absent', async () => {
    const token = 'classic-token';
    const mockExecute = vi.fn().mockResolvedValue(token);
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', { ready: mockReady, execute: mockExecute });

    const callback = {
      setResult: vi.fn(),
      setAction: vi.fn(),
      setClientError: vi.fn(),
    } as unknown as ReCaptchaEnterpriseCallback;
    executeEnterpriseCaptcha({ siteKey: 'classic-key', action: 'SUBMIT', callback });

    await vi.waitFor(() => expect(callback.setResult).toHaveBeenCalledWith(token));
    expect(callback.setAction).toHaveBeenCalledWith('SUBMIT');
  });

  it('calls onError and returns when grecaptcha is not loaded', () => {
    const callback = {
      setResult: vi.fn(),
      setAction: vi.fn(),
      setClientError: vi.fn(),
    } as unknown as ReCaptchaEnterpriseCallback;
    const onError = vi.fn();
    executeEnterpriseCaptcha({ siteKey: 'site-key', action: 'LOGIN', callback, onError });

    expect(onError).toHaveBeenCalledOnce();
    expect(callback.setResult).not.toHaveBeenCalled();
  });

  it('passes siteKey and action to execute', async () => {
    const mockExecute = vi.fn().mockResolvedValue('tok');
    const mockReady = vi.fn((fn: () => void) => fn());
    vi.stubGlobal('grecaptcha', { enterprise: { ready: mockReady, execute: mockExecute } });

    const callback = {
      setResult: vi.fn(),
      setAction: vi.fn(),
      setClientError: vi.fn(),
    } as unknown as ReCaptchaEnterpriseCallback;
    executeEnterpriseCaptcha({ siteKey: 'my-site-key', action: 'REGISTER', callback });

    await vi.waitFor(() =>
      expect(mockExecute).toHaveBeenCalledWith('my-site-key', { action: 'REGISTER' }),
    );
  });
});
