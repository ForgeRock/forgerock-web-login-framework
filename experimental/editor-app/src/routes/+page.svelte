<!--
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * -->

<!-- Journey Components list — tabs, table, global publish, per-row delete (IAM-12074). -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { createRecord, deleteRecord, publishBundle } from '$lib/api';

  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const TAB_LABELS: Record<string, string> = {
    stage: 'Stage Components',
    callback: 'Callback Components',
    layout: 'Layout',
  };

  const SECOND_COLUMN: Record<string, string> = {
    stage: 'Stage Identifier',
    callback: 'Callback Type',
    layout: 'Kind',
  };

  const CREATE_LABELS: Record<string, string> = {
    stage: 'Create Stage Component',
    callback: 'Create Callback Component',
  };

  let searchTerm = $state<string>('');
  let confirmingId = $state<string>('');
  let publishing = $state<boolean>(false);
  let publishResult = $state<string>('');

  // Create dialog state (the design funnels create through a modal into the editor).
  let creating = $state<boolean>(false);
  let createName = $state<string>('');
  let createDisplayName = $state<string>('');
  let createError = $state<string>('');
  let createBusy = $state<boolean>(false);

  const createType = $derived(data.tabTypes[0]);

  let entries = $derived(data.entries);

  const visibleEntries = $derived(
    entries.filter((entry) => {
      const needle = searchTerm.trim().toLowerCase();
      if (needle === '') {
        return true;
      }
      return (
        entry.record.meta.displayName.toLowerCase().includes(needle) ||
        entry.record.meta.name.toLowerCase().includes(needle)
      );
    }),
  );

  // Publishing is one global command: the bundle ships every component's source.
  const bundleCode = $derived(
    entries
      .map(
        (entry) =>
          `/* ${entry.type}/${entry.record.meta.name || 'unnamed'} */\n${entry.record.src}`,
      )
      .join('\n\n'),
  );

  const formatDate = (isoDate: string): string =>
    new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  async function remove(type: string, id: string): Promise<void> {
    // Arm in place: re-rendering would collapse the open <details> menu.
    if (confirmingId !== id) {
      confirmingId = id;
      const button = document.querySelector<HTMLButtonElement>(`[data-delete="${id}"]`);
      if (button) {
        button.textContent = 'Confirm delete?';
      }
      return;
    }
    const result = await deleteRecord(type, id);
    if (!result.ok) {
      return;
    }
    entries = entries.filter((candidate) => candidate.record.id !== id);
    confirmingId = '';
  }

  async function publish(): Promise<void> {
    publishing = true;
    const result = await publishBundle(bundleCode);
    publishing = false;
    publishResult = result.ok ? 'Published ✓' : '';
  }

  async function create(): Promise<void> {
    if (!createName.trim() || !createDisplayName.trim()) {
      createError = 'Name and display name are required.';
      return;
    }
    createBusy = true;
    createError = '';
    const result = await createRecord(createType, {
      src: `<!--\n@component\nType: ${
        createType === 'stages' ? 'stage' : 'callback'
      }\nName: \n-->\n`,
      meta: {
        name: createName.trim(),
        displayName: createDisplayName.trim(),
        publish: false,
        fromComponent: '',
        fromJson: '',
      },
    });
    createBusy = false;
    if (!result.ok) {
      createError = result.message;
      return;
    }
    creating = false;
    await goto(`/custom-components/${createType}/${result.data.id}`);
  }
</script>

<svelte:head>
  <title>Journey Components</title>
</svelte:head>

<div class="tw_max-w-3xl tw_mx-auto tw_py-6 tw_px-4">
  <header class="tw_flex tw_items-start tw_justify-between tw_gap-4">
    <div>
      <h1 class="tw_text-2xl tw_m-0">Journey Components</h1>
      <p class="tw_m-0 tw_text-sm tw_text-gray-500">
        Customize the UI used by journeys in hosted and embedded login experiences.
      </p>
    </div>
    <div class="tw_flex tw_items-center tw_gap-3 tw_pt-1">
      <span class="tw_text-xs tw_text-gray-500">{publishResult}</span>
      <button
        class="tw_text-xs tw_text-white tw_bg-primary-light hover:tw_bg-slate-700 tw_px-5 tw_py-2 tw_rounded-full tw_font-semibold tw_whitespace-nowrap disabled:tw_opacity-50 disabled:tw_cursor-not-allowed"
        type="button"
        onclick={publish}
        disabled={publishing || entries.length === 0}
      >
        {publishing ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  </header>

  <nav
    class="tw_flex tw_gap-6 tw_border-b tw_border-slate-200 tw_mt-5"
    aria-label="Component families"
  >
    {#each Object.entries(TAB_LABELS) as [tabId, label] (tabId)}
      <a
        class="tw_py-2 tw_text-sm tw_no-underline tw_border-b-2 tw_border-transparent hover:tw_text-gray-700 {tabId ===
        data.tabId
          ? 'tw_text-primary-light tw_font-semibold tw_border-primary-light'
          : 'tw_text-gray-500'}"
        href={`/custom-components?tab=${tabId}`}
      >
        {label}
      </a>
    {/each}
  </nav>

  {#if CREATE_LABELS[data.tabId]}
    <div class="tw_flex tw_items-center tw_justify-between tw_gap-4 tw_mt-5 tw_mb-3">
      <button
        class="tw_text-xs tw_text-white tw_bg-primary-light hover:tw_bg-slate-700 tw_px-4 tw_py-2 tw_rounded-full tw_font-semibold tw_whitespace-nowrap"
        type="button"
        onclick={() => (creating = true)}
      >
        + {CREATE_LABELS[data.tabId]}
      </button>
      <input
        class="tw_text-xs tw_px-3 tw_py-2 tw_border tw_border-slate-200 tw_rounded-md tw_w-64"
        type="search"
        placeholder="Search"
        bind:value={searchTerm}
        aria-label="Search components"
      />
    </div>
  {:else}
    <p class="tw_text-xs tw_text-gray-500 tw_mt-5 tw_mb-3">
      Edit the global Header, Footer, and Page Container used across journeys.
    </p>
  {/if}

  {#if data.failed}
    <p class="tw_text-sm tw_text-error-dark">
      Failed to load components. Is the Component API enabled and are you signed in as an admin?
    </p>
  {:else if visibleEntries.length === 0}
    <p class="tw_text-sm tw_text-gray-500">
      {searchTerm === ''
        ? 'No components yet. Create the first one to get started.'
        : 'No components match the search.'}
    </p>
  {:else}
    <table
      class="tw_w-full tw_border-collapse tw_border tw_border-slate-200 tw_rounded-lg tw_bg-white tw_text-sm"
    >
      <thead>
        <tr>
          <th
            class="tw_text-left tw_text-xs tw_font-semibold tw_tracking-wider tw_uppercase tw_text-gray-500 tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200"
          >
            Name
          </th>
          <th
            class="tw_text-left tw_text-xs tw_font-semibold tw_tracking-wider tw_uppercase tw_text-gray-500 tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200"
          >
            {SECOND_COLUMN[data.tabId]}
          </th>
          <th
            class="tw_text-left tw_text-xs tw_font-semibold tw_tracking-wider tw_uppercase tw_text-gray-500 tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200"
          >
            Last Updated
          </th>
          <th class="tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200">
            <span class="tw_sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each visibleEntries as entry (entry.record.id)}
          <tr class="hover:tw_bg-sky-50 [&:last-child>td]:tw_border-b-0">
            <td class="tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200">
              <a
                class="tw_no-underline"
                href={`/custom-components/${entry.type}/${entry.record.id}`}
              >
                <span class="tw_font-semibold tw_text-gray-700">
                  {entry.record.meta.displayName || entry.record.meta.name || '(unnamed)'}
                </span>
              </a>
            </td>
            <td
              class="tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200 tw_font-mono tw_text-gray-700"
            >
              {entry.record.meta.name || 'no name'}
            </td>
            <td class="tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200 tw_text-gray-500">
              {formatDate(entry.record.meta.modifiedDate)}
            </td>
            <td class="tw_px-4 tw_py-2.5 tw_border-b tw_border-slate-200 tw_text-right tw_w-12">
              <details class="tw_relative tw_inline-block">
                <summary
                  class="tw_list-none tw_cursor-pointer tw_px-2 tw_py-0.5 tw_rounded-md tw_text-gray-500 tw_font-bold hover:tw_bg-slate-200 hover:tw_text-gray-700 [&::-webkit-details-marker]:tw_hidden"
                  aria-label="Row actions"
                >
                  ⋯
                </summary>
                <div
                  class="tw_absolute tw_right-0 tw_top-full tw_z-10 tw_flex tw_flex-col tw_min-w-[9rem] tw_bg-white tw_border tw_border-slate-200 tw_rounded-lg tw_shadow-md tw_p-1"
                >
                  <button
                    type="button"
                    class="tw_text-left tw_text-xs tw_px-2.5 tw_py-1.5 tw_border-0 tw_bg-transparent tw_rounded-md tw_cursor-pointer tw_text-error-dark hover:tw_bg-sky-50"
                    data-delete={entry.record.id}
                    onclick={() => remove(entry.type, entry.record.id)}
                  >
                    {confirmingId === entry.record.id ? 'Confirm delete?' : 'Delete'}
                  </button>
                </div>
              </details>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if creating}
    <div
      class="tw_fixed tw_inset-0 tw_bg-slate-900/45 tw_flex tw_items-center tw_justify-center tw_z-40"
    >
      <div
        class="tw_w-[28rem] tw_max-w-[calc(100vw-2rem)] tw_bg-white tw_rounded-xl tw_shadow-2xl tw_p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
      >
        <header class="tw_flex tw_items-center tw_justify-between tw_mb-4">
          <h2 id="create-title" class="tw_text-base tw_font-semibold tw_m-0">
            {CREATE_LABELS[data.tabId]}
          </h2>
          <button
            class="tw_text-xl tw_leading-none tw_text-gray-500 tw_bg-transparent tw_border-0 tw_cursor-pointer"
            type="button"
            aria-label="Close"
            onclick={() => (creating = false)}
          >
            ×
          </button>
        </header>
        <div class="tw_flex tw_gap-3 tw_mb-3">
          <label
            class="tw_flex-1 tw_flex tw_flex-col tw_gap-1 tw_text-xs tw_font-semibold tw_text-gray-500"
          >
            Name
            <input
              class="tw_text-sm tw_px-2.5 tw_py-1.5 tw_border tw_border-slate-200 tw_rounded-md"
              bind:value={createName}
              placeholder="kebab-case-name"
              required
            />
          </label>
          <label
            class="tw_flex-1 tw_flex tw_flex-col tw_gap-1 tw_text-xs tw_font-semibold tw_text-gray-500"
          >
            Display name
            <input
              class="tw_text-sm tw_px-2.5 tw_py-1.5 tw_border tw_border-slate-200 tw_rounded-md"
              bind:value={createDisplayName}
              placeholder="Human-readable name"
              required
            />
          </label>
        </div>
        {#if createError}
          <p class="tw_text-xs tw_text-error-dark tw_m-0 tw_mb-3">{createError}</p>
        {/if}
        <footer class="tw_flex tw_justify-end tw_gap-2">
          <button
            class="tw_text-xs tw_text-gray-700 tw_bg-transparent tw_border tw_border-slate-400 tw_rounded-full tw_px-4 tw_py-2 tw_cursor-pointer"
            type="button"
            onclick={() => (creating = false)}
          >
            Cancel
          </button>
          <button
            class="tw_text-xs tw_text-white tw_bg-primary-light hover:tw_bg-slate-700 tw_px-4 tw_py-2 tw_rounded-full tw_font-semibold tw_whitespace-nowrap disabled:tw_opacity-50"
            type="button"
            onclick={create}
            disabled={createBusy}
          >
            {createBusy ? 'Creating…' : 'Create Component'}
          </button>
        </footer>
      </div>
    </div>
  {/if}
</div>
