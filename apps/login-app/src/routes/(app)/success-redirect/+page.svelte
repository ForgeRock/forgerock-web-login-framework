<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
	import Box from '$components/primitives/box/centered.svelte';
	import ShieldIcon from '$components/icons/shield-icon.svelte';
</script>

<Box>
	<div class="tw_flex tw_flex-col tw_items-center tw_text-center tw_gap-4">
		<div class="tw_flex tw_justify-center">
			<ShieldIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
		</div>

		<h1 class="tw_primary-header dark:tw_primary-header_dark">Signed in</h1>
		<p class="tw_text-secondary-dark dark:tw_text-secondary-light">
			Your sign-in was successful, but we couldn't redirect you automatically.
		</p>
		<p class="tw_text-secondary-dark dark:tw_text-secondary-light">
			You can close this tab and return to the application.
		</p>
	</div>
</Box>
