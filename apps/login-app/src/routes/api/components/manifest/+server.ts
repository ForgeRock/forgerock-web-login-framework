/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { Path } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { getBundleManifest } from '$lib/server/custom-components/api/api';

import type { RequestHandler } from './$types';

/** The platform services for the pointer read, provided per request like ComponentApiLive. */
const ManifestLive = Layer.mergeAll(NodeFileSystem.layer, Path.layer);

/**
 * Returns the runtime resource manifest:
 * `{ componentsBundle: <URL of the latest published custom components bundle> }`,
 * as committed by the last publish.
 *
 * The one public Component API route: unauthenticated, ungated, and available
 * wherever the app deploys — hosts bootstrap through it before any session
 * exists, and a disabled deployment simply serves a 404 (nothing published).
 *
 * @returns A response with 200 and the manifest JSON, or 404 when nothing is published.
 */
export const GET: RequestHandler = () =>
  Effect.runPromise(Effect.provide(getBundleManifest(), ManifestLive));
