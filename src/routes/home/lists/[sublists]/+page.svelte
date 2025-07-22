<script lang="ts">
	import {
		global_address,
		global_lists,
		global_lists_report,
		loadedStatus,
		reset_address
	} from '$lib/global.svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { capitalizeFirstLetter } from '$lib/utils/utils';
	import DataView from '../../../components/dataView.svelte';
	import { onMount } from 'svelte';
	import { card_dynamic } from '$lib/styles';
	import type { ListAddress } from '$lib/types';

	let pathSegments = $derived(page.url.pathname.split('/').filter(Boolean));
	let crumb = $derived(pathSegments[pathSegments.length - 1]);

	let reverse = $state(1);

	onMount(() => {
		reset_address();
		Object.assign(global_address, {
			category: 'Lists',
			listKey: crumb
		} satisfies ListAddress);

		console.log(global_lists_report.lists[crumb]);
	});
</script>

{#if loadedStatus.lists}
	<div
		in:fly|global={{ x: 10 * reverse, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10 * reverse, duration: 100 }}
		class="grid grid-cols-1 sm:grid-cols-2 gap-3"
	>
		{#if global_lists[crumb]}
			{#each Object.entries(global_lists[crumb]) as [sublistKey]}
				<a
					data-sveltekit-preload-code="eager"
					class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col rounded-md text-center {card_dynamic}"
					href="{page.url.pathname}/{sublistKey}"
				>
					<h3 class="text-xl mb-2">{capitalizeFirstLetter(sublistKey)}</h3>
					<DataView
						completionReport={global_lists_report.lists[crumb].sublists[sublistKey].sublistReport}
						options={{ showKey: true }}
					/>
					<!--<DataView completionReport={{ complete: 3, incomplete: 10, needsReview: 1 }} />-->
				</a>
			{/each}
		{/if}
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
