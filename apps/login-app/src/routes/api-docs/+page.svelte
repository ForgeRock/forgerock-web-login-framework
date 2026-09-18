<script lang="ts">
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';
  import 'swagger-ui/dist/swagger-ui.css';

  let swaggerUi: HTMLDivElement;

  onMount(async () => {
    if (!dev) return;

    const { default: SwaggerUI } = await import('swagger-ui');

    SwaggerUI({
      domNode: swaggerUi,
      url: '/api/openapi',
    });
  });
</script>

<svelte:head>
  <title>API documentation</title>
</svelte:head>

{#if dev}
  <main class="mx-auto max-w-screen-xl p-6">
    <h1 class="mb-6 text-3xl font-semibold">API documentation</h1>
    <div bind:this={swaggerUi}></div>
  </main>
{:else}
  <main class="mx-auto max-w-screen-md p-6 text-center">
    <h1 class="text-3xl font-semibold">404</h1>
    <p class="mt-2">This page is only available during development.</p>
  </main>
{/if}
