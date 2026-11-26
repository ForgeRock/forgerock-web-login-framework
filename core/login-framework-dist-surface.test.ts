/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { surfaceDistModule } from './login-framework-dist-surface';

/**
 * Unit tests for the generated dist surface module
 * (`dist/login-framework.js`). The curated surface is pure re-exports, so
 * its compiled form is generated: every runtime re-export maps onto the
 * package's emitted dist path (same rename conventions the client and
 * server builds apply). Type-only re-exports vanish (customer type imports
 * keep resolving to the source surface through tsconfig paths), and any
 * statement form the parity check forbids fails closed.
 */

const CLIENT = { tree: 'client' } as const;
const SERVER = { tree: 'server' } as const;

describe('surfaceDistModule', () => {
  it('maps a $components .svelte re-export onto the emitted component module', () => {
    const output = surfaceDistModule(
      "export { default as Form } from '$components/primitives/form/form.svelte';\n",
      CLIENT,
    );
    expect(output).toContain(
      `export { default as Form } from './components/primitives/form/form.component.js';`,
    );
  });

  it('maps named (non-default) re-exports onto the emitted .js module', () => {
    const output = surfaceDistModule(
      "export { interpolate } from '$core/_utilities/i18n.utilities';\n",
      CLIENT,
    );
    expect(output).toContain(`export { interpolate } from './_utilities/i18n.utilities.js';`);
  });

  it('maps $journey re-exports onto the journey dist subtree', () => {
    const output = surfaceDistModule(
      "export { convertStringToKey } from '$journey/_utilities/step.utilities';\n",
      CLIENT,
    );
    expect(output).toContain(
      `export { convertStringToKey } from './journey/_utilities/step.utilities.js';`,
    );
  });

  it('renames exported names (initialize as initializeLinks)', () => {
    const output = surfaceDistModule(
      "export { initialize as initializeLinks } from '$core/links.store';\n",
      CLIENT,
    );
    expect(output).toContain(`export { initialize as initializeLinks } from './links.store.js';`);
  });

  it('skips type-only re-exports (types resolve from the source surface)', () => {
    const output = surfaceDistModule(
      [
        "export type { Maybe } from '$core/interfaces';",
        "export { default as Button } from '$components/primitives/button/button.svelte';",
      ].join('\n'),
      CLIENT,
    );
    expect(output).not.toContain('Maybe');
    expect(output).toContain(`'./components/primitives/button/button.component.js'`);
  });

  it('fails closed on a wildcard re-export (parity check guarantees none, generator refuses anyway)', () => {
    expect(() => surfaceDistModule("export * from '$core/style.store';\n", CLIENT)).toThrow(
      /wildcard/i,
    );
  });

  it('fails closed on an unsupported statement form', () => {
    expect(() => surfaceDistModule('export const bootleg = 1;\n', CLIENT)).toThrow(/unsupported/i);
  });

  it('fails closed on an external runtime re-export', () => {
    expect(() => surfaceDistModule("export { something } from 'some-package';\n", CLIENT)).toThrow(
      /external/i,
    );
  });

  it('emits nothing but comments for a surface with only type exports', () => {
    const output = surfaceDistModule(
      "export type { Maybe } from '$core/interfaces';\nexport interface Foo { x: number }\n",
      CLIENT,
    );
    expect(output).not.toMatch(/^export /m);
  });

  it('server tree maps to the same emitted names (both trees mirror the source layout)', () => {
    const client = surfaceDistModule(
      "export { default as CallbackMapper } from '$journey/_utilities/callback-mapper.svelte';\n",
      CLIENT,
    );
    const server = surfaceDistModule(
      "export { default as CallbackMapper } from '$journey/_utilities/callback-mapper.svelte';\n",
      SERVER,
    );
    expect(client).toContain(`'./journey/_utilities/callback-mapper.component.js'`);
    expect(server).toContain(`'./journey/_utilities/callback-mapper.component.js'`);
  });
});
