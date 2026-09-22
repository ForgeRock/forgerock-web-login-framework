<!--
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * -->

<!-- Dev-only page hosting Swagger UI fed by /api/openapi. -->
<script lang="ts">
  import { onMount } from 'svelte';

  let swaggerUi: HTMLDivElement;
  let unavailable = false;

  onMount(async () => {
    try {
      const response = await fetch('/api/openapi');

      if (!response.ok) {
        unavailable = true;
        return;
      }

      await import('swagger-ui-dist/swagger-ui.css');
      const { default: SwaggerUIBundle } = await import('swagger-ui-dist/swagger-ui-bundle.js');

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

<main class="mx-auto max-w-screen-xl p-6">
  <h1 class="mb-6 text-3xl font-semibold">API documentation</h1>

  {#if unavailable}
    <p>OpenAPI spec is only available in dev mode.</p>
  {:else}
    <div class="swagger-ui-container">
      <div id="swagger-ui" bind:this={swaggerUi}></div>
    </div>
  {/if}
</main>

<style>
  .swagger-ui-container :global(.swagger-ui .opblock-tag) {
    margin-top: 2rem;
    padding: 1rem;
    border-left: 4px solid #4f46e5;
    border-radius: 0.5rem;
    background-color: #eef2ff;
    color: #1f2937;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    line-height: 1.25;
    text-transform: uppercase;
  }

  .swagger-ui-container :global(.swagger-ui .opblock-tag:first-of-type) {
    margin-top: 0;
  }
</style>
