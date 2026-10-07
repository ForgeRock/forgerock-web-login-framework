<!--
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * -->

<!-- Swagger UI page fed by /api/openapi; renders the spec wherever the Component API is enabled. -->
<script lang="ts">
  import { onMount } from 'svelte';

  let unavailable = false;

  onMount(async () => {
    try {
      const response = await fetch('/api/openapi');

      if (!response.ok) {
        unavailable = true;
        return;
      }

      await import('swagger-ui-dist/swagger-ui.css');
      // Vite pre-bundles swagger-ui-dist as a default-only ES module.
      const mod = await import('swagger-ui-dist/swagger-ui-bundle.js');
      const SwaggerUIBundle = mod.SwaggerUIBundle ?? mod.default;

      // Swagger UI accesses the DOM, so initialize it only after client-side mounting.
      SwaggerUIBundle({
        dom_id: '#swagger-ui',
        url: '/api/openapi',
        docExpansion: 'none',
      });
    } catch {
      unavailable = true;
    }
  });
</script>

<svelte:head>
  <title>API documentation</title>
</svelte:head>

<main class="tw_bg-background-light dark:tw_bg-background-dark tw_min-h-screen tw_p-6">
  <h1 class="tw_primary-header dark:tw_primary-header_dark">API documentation</h1>

  {#if unavailable}
    <p class="tw_text-secondary-dark dark:tw_text-secondary-light">
      OpenAPI spec is only available while the Component API is enabled.
    </p>
  {:else}
    <div class="swagger-ui-container">
      <div id="swagger-ui"></div>
    </div>
  {/if}
</main>
