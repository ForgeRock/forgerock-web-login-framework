<!--
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * -->

<!-- Editor view — top bar (back | name + badge | Reset + Save), file tab, source pane (IAM-12074). -->
<script lang="ts">
  import { isHttpError } from '@sveltejs/kit';

  import { updateRecord } from '../../commands.remote';

  import type { ComponentRecord } from '../../commands.remote';
  import type { PageData } from './$types';

  /** Route type (plural) → design badge (singular). */
  const TYPE_LABELS: Record<string, string> = {
    callbacks: 'Callback Component',
    stages: 'Stage Component',
    containers: 'Layout Component',
    headers: 'Layout Component',
    footers: 'Layout Component',
  };

  export let data: PageData;

  // Initialize editable state from the loaded record once; the load re-runs on
  // navigation, remounting this view with fresh data.
  let record: ComponentRecord = data.record;
  let savedRecord: ComponentRecord = data.record;
  let src = data.record.src;
  let name = data.record.meta.name;
  let displayName = data.record.meta.displayName;
  let status = '';
  let error = '';

  $: dirty =
    src !== savedRecord.src ||
    name !== savedRecord.meta.name ||
    displayName !== savedRecord.meta.displayName;

  async function save(): Promise<void> {
    status = 'Saving…';
    error = '';
    let updated: ComponentRecord;
    try {
      updated = await updateRecord({
        type: data.type,
        id: data.id,
        src,
        meta: { ...record.meta, name, displayName },
      });
    } catch (cause) {
      status = '';
      error = isHttpError(cause) ? cause.body.message : 'Failed to save component';
      return;
    }
    record = updated;
    savedRecord = updated;
    status = `Saved ✓ ${new Date(updated.meta.modifiedDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  function reset(): void {
    src = savedRecord.src;
    name = savedRecord.meta.name;
    displayName = savedRecord.meta.displayName;
    status = '';
    error = '';
  }
</script>

<svelte:head>
  <title>{displayName || 'Component Editor'}</title>
</svelte:head>

<div class="tw_max-w-6xl tw_mx-auto tw_py-3 tw_px-4">
  <header
    class="tw_grid tw_grid-cols-[1fr_auto_1fr] tw_items-center tw_gap-3 tw_pb-3 tw_border-b tw_border-slate-200"
  >
    <div class="tw_flex tw_items-center tw_gap-2">
      <a
        href="/editor/components/{data.tabId}"
        class="tw_no-underline tw_text-base tw_text-gray-500 hover:tw_text-gray-700"
        aria-label="Back to Journey Components"
      >
        &larr;
      </a>
      <span class="tw_text-xs tw_text-gray-500">Journey Components</span>
    </div>
    <div class="tw_flex tw_items-center tw_gap-2">
      <span class="tw_text-base tw_font-semibold">{displayName}</span>
      <span
        class="tw_text-[0.6875rem] tw_font-semibold tw_text-primary-light tw_bg-sky-100 tw_rounded tw_px-1.5 tw_py-0.5"
      >
        {TYPE_LABELS[data.type] ?? data.type}
      </span>
      <span class="tw_font-mono tw_text-xs tw_text-gray-500">{name || 'no name'}</span>
    </div>
    <div class="tw_flex tw_items-center tw_justify-end tw_gap-2">
      <button
        class="tw_text-xs tw_text-gray-500 tw_bg-transparent tw_border-0 tw_cursor-pointer tw_font-semibold disabled:tw_opacity-50 disabled:tw_cursor-not-allowed hover:tw_text-gray-700"
        type="button"
        on:click={reset}
        disabled={!dirty}
      >
        Reset
      </button>
      <button
        class="tw_text-xs tw_text-white tw_bg-primary-light hover:tw_bg-slate-700 tw_px-5 tw_py-2 tw_border-0 tw_rounded-full tw_font-semibold tw_cursor-pointer"
        type="button"
        on:click={save}
      >
        Save
      </button>
    </div>
  </header>

  {#if error}
    <pre
      class="tw_m-3 tw_p-2 tw_px-3 tw_border tw_border-error-dark tw_rounded-md tw_bg-red-50 tw_text-error-dark tw_text-xs tw_whitespace-pre-wrap">{error}</pre>
  {/if}

  <div class="tw_flex tw_items-center tw_gap-3 tw_my-3">
    <span
      class="tw_text-xs tw_text-gray-700 tw_font-semibold tw_px-3 tw_py-1 tw_border tw_border-slate-200 tw_rounded-t-md tw_bg-white"
    >
      {name || 'component'}.svelte
    </span>
    <span class="tw_text-xs tw_text-gray-500">{status}</span>
  </div>

  <div class="tw_flex tw_gap-3 tw_mb-3">
    <label
      class="tw_flex-1 tw_flex tw_flex-col tw_gap-1 tw_text-xs tw_font-semibold tw_text-gray-500"
    >
      Display name
      <input
        class="tw_text-sm tw_px-2.5 tw_py-1.5 tw_border tw_border-slate-200 tw_rounded-md"
        bind:value={displayName}
        placeholder="Human-readable name"
      />
    </label>
    <label
      class="tw_flex-1 tw_flex tw_flex-col tw_gap-1 tw_text-xs tw_font-semibold tw_text-gray-500"
    >
      Identifier
      <input
        class="tw_text-sm tw_px-2.5 tw_py-1.5 tw_border tw_border-slate-200 tw_rounded-md"
        bind:value={name}
        placeholder="kebab-case-name"
      />
    </label>
  </div>
  {#await import('../../editor-placeholder.svelte')}
    <div
      class="tw_w-full tw_h-[38rem] tw_border tw_border-slate-200 tw_rounded-md tw_bg-slate-50 tw_animate-pulse"
      role="status"
      aria-label="Loading source editor"
    ></div>
  {:then { default: SourceTextarea }}
    <SourceTextarea bind:value={src} />
  {/await}
</div>
