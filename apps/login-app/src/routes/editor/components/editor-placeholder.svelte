<!--
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * -->

<!-- Client-only editor stand-in: a plain textarea until the real code editor
     (Monaco) lands via SDKS-5259, at which point this file is replaced. -->
<script lang="ts">
  export let value = '';
</script>

<label class="tw_flex tw_flex-col tw_gap-1 tw_text-xs tw_font-semibold tw_text-gray-500">
  <span class="tw_sr-only">Source</span>
  <textarea
    class="tw_w-full tw_font-mono tw_text-[0.8125rem] tw_leading-relaxed tw_p-3 tw_border tw_border-slate-200 tw_rounded-md tw_resize-y"
    bind:value
    rows="24"
    spellcheck="false"
  ></textarea>
</label>
