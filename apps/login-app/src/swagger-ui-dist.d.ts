/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

declare module 'swagger-ui-dist/swagger-ui-bundle.js' {
  interface SwaggerUIBundleOptions {
    dom_id: string;
    url: string;
    docExpansion: string;
  }
  export function SwaggerUIBundle(options: SwaggerUIBundleOptions): unknown;
}
