/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

import { selectRegistryEntry } from './select-registry-entry.utilities';

import type { CustomRegistryEntry } from './custom-registry';

const makeEntry = (acceptedProps: string[] = []): CustomRegistryEntry => ({
  component: (() => null) as unknown as CustomRegistryEntry['component'],
  acceptedProps,
});

const headerEntry = makeEntry(['title']);
const footerEntry = makeEntry();

describe('selectRegistryEntry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('unset name (undefined)', () => {
    it('returns undefined silently when the registry is empty', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const result = selectRegistryEntry(undefined, {}, 'header', 'PUBLIC_CUSTOM_HEADER_NAME');
      expect(result).toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns and returns undefined when registry has entries but no name is set', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = selectRegistryEntry(
        undefined,
        { Brand: headerEntry },
        'header',
        'PUBLIC_CUSTOM_HEADER_NAME',
      );
      expect(result).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain(
        '1 custom header component(s) exist but no PUBLIC_CUSTOM_HEADER_NAME is set',
      );
      expect(String(warn.mock.calls[0][0])).toContain('Available names: Brand');
    });

    it('does not warn when a footer registry has entries but the header registry is empty', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = selectRegistryEntry(undefined, {}, 'footer', 'PUBLIC_CUSTOM_FOOTER_NAME');
      expect(result).toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('unset name (empty string)', () => {
    it('treats an empty string like unset', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = selectRegistryEntry(
        '',
        { Brand: headerEntry },
        'header',
        'PUBLIC_CUSTOM_HEADER_NAME',
      );
      expect(result).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('set name', () => {
    it('returns the matching entry for an exact key match', () => {
      const result = selectRegistryEntry(
        'Brand',
        { Brand: headerEntry },
        'header',
        'PUBLIC_CUSTOM_HEADER_NAME',
      );
      expect(result).toBe(headerEntry);
    });

    it('matches keys with spaces exactly', () => {
      const entry = makeEntry();
      const result = selectRegistryEntry(
        'Legal Footer',
        { 'Legal Footer': entry },
        'footer',
        'PUBLIC_CUSTOM_FOOTER_NAME',
      );
      expect(result).toBe(entry);
    });

    it('throws when the name does not exist in the registry', () => {
      expect(() =>
        selectRegistryEntry('Ghost', { Brand: headerEntry }, 'header', 'PUBLIC_CUSTOM_HEADER_NAME'),
      ).toThrowError(/PUBLIC_CUSTOM_HEADER_NAME is set to "Ghost"/);
    });

    it('lists available names in the unknown-name error', () => {
      expect(() =>
        selectRegistryEntry(
          'Ghost',
          { Brand: headerEntry, Alternate: makeEntry() },
          'header',
          'PUBLIC_CUSTOM_HEADER_NAME',
        ),
      ).toThrowError(/Available names: Brand, Alternate/);
    });

    it('throws with "(none)" when the registry is empty and a name is set', () => {
      expect(() =>
        selectRegistryEntry('Brand', {}, 'header', 'PUBLIC_CUSTOM_HEADER_NAME'),
      ).toThrowError(/Available names: \(none\)/);
    });

    it('is case-sensitive: "brand" does not match "Brand"', () => {
      expect(() =>
        selectRegistryEntry('brand', { Brand: headerEntry }, 'header', 'PUBLIC_CUSTOM_HEADER_NAME'),
      ).toThrowError(/is set to "brand"/);
    });

    it('does not trim the configured name', () => {
      expect(() =>
        selectRegistryEntry(
          ' Brand ',
          { Brand: headerEntry },
          'header',
          'PUBLIC_CUSTOM_HEADER_NAME',
        ),
      ).toThrowError(/is set to " Brand "/);
    });

    it('does not resolve inherited Object.prototype members like "__proto__" or "constructor"', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() =>
        selectRegistryEntry(
          '__proto__',
          { Brand: headerEntry },
          'header',
          'PUBLIC_CUSTOM_HEADER_NAME',
        ),
      ).toThrowError(/is set to "__proto__"/);
      expect(() =>
        selectRegistryEntry(
          'constructor',
          { Brand: headerEntry },
          'header',
          'PUBLIC_CUSTOM_HEADER_NAME',
        ),
      ).toThrowError(/is set to "constructor"/);
      expect(() =>
        selectRegistryEntry(
          'toString',
          { Brand: headerEntry },
          'header',
          'PUBLIC_CUSTOM_HEADER_NAME',
        ),
      ).toThrowError(/is set to "toString"/);
      expect(warn).not.toHaveBeenCalled();
    });

    it('resolves header and footer registries independently', () => {
      const headerResult = selectRegistryEntry(
        'Brand',
        { Brand: headerEntry },
        'header',
        'PUBLIC_CUSTOM_HEADER_NAME',
      );
      const footerResult = selectRegistryEntry(
        'Legal',
        { Legal: footerEntry },
        'footer',
        'PUBLIC_CUSTOM_FOOTER_NAME',
      );
      expect(headerResult).toBe(headerEntry);
      expect(footerResult).toBe(footerEntry);
    });
  });
});
