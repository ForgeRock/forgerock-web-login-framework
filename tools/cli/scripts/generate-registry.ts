#!/usr/bin/env node
/**
 * Thin Effect runner for generating the custom component registry.
 *
 * Called by:
 *  - packages/login-widget/package.json  "prebuild"
 *  - Root package.json                    "generate:registry"
 *
 * Requires the CLI to be compiled first:
 *   pnpm --filter @forgerock/login-framework-cli run build
 */
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect } from 'effect';

const { runRegistryScript } = await import('../src/services/registry.js');

const projectDir = process.argv[2];
if (!projectDir) {
  console.error('Usage: node generate-registry.mjs <projectDir>');
  process.exit(1);
}

NodeRuntime.runMain(runRegistryScript(projectDir).pipe(Effect.provide(NodeContext.layer)));
