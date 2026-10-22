// IAM-12011 — the sandbox iframe is long-lived and the framework stores are
// module singletons, so a demo that mutates them leaks into the next demo.
// Example: demo-widget-runtime calls configure(), which runs
// initializeLinks(undefined) and wipes the placeholder termsAndConditions link,
// so the TermsAndConditions demo then showed "Configuration is missing
// termsAndConditions URL". The sandbox must reboot the stores before every render.
import { describe, expect, it } from 'vitest';

import { buildSandboxSrcdoc } from './sandbox';

const srcdoc = buildSandboxSrcdoc({
  devServerOrigin: 'http://localhost:5199',
  frameworkEntryUrl: 'http://localhost:5199/@fs/framework/preview-framework.ts',
});

const renderHandler = srcdoc.slice(srcdoc.indexOf("addEventListener('message'"));

describe('sandbox store boot (IAM-12011)', () => {
  it('defines a single boot function that initializes locale, links and styles', () => {
    const bootDefinition = srcdoc.slice(
      srcdoc.indexOf('bootFramework = '),
      srcdoc.indexOf("addEventListener('message'"),
    );

    expect(bootDefinition).toContain('initializeLocale');
    expect(bootDefinition).toContain('initializeLinks');
    expect(bootDefinition).toContain('termsAndConditions');
    expect(bootDefinition).toContain('initializeStyles');
  });

  it('boots the stores once on load before announcing framework-ready', () => {
    const loadScript = srcdoc.slice(
      srcdoc.indexOf('bootFramework = '),
      srcdoc.indexOf("addEventListener('message'"),
    );

    expect(loadScript.indexOf('await bootFramework()')).toBeGreaterThan(-1);
    expect(loadScript.indexOf('await bootFramework()')).toBeLessThan(
      loadScript.indexOf("type: 'framework-ready'"),
    );
  });

  it('boots the stores again before every render, ahead of the component import', () => {
    const bootCall = renderHandler.indexOf('await bootFramework()');
    const componentImport = renderHandler.indexOf('await import(url)');

    expect(bootCall).toBeGreaterThan(-1);
    expect(componentImport).toBeGreaterThan(-1);
    expect(bootCall).toBeLessThan(componentImport);
  });
});
