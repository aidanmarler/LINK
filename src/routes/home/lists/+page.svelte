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
	import { capitalizeFirstLetter } from '$lib/utils';
	import DataView from '../dataView.svelte';
	import { onMount } from 'svelte';
	import { card_dynamic } from '$lib/styles';

	let reverse = $state(1);

	onMount(() => {
		reset_address();
		global_address.category = 'Lists';
		console.log($state.snapshot(global_address));
	});
</script>

{#if loadedStatus.lists}
	<div
		in:fly|global={{ x: 10 * reverse, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10 * reverse, duration: 100 }}
		class="grid grid-cols-1 sm:grid-cols-2 gap-3"
	>
		{#each Object.entries(global_lists) as [listKey], i (listKey)}
			<a
				data-sveltekit-preload-code="eager"
				class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col text-center {card_dynamic}"
				href="{page.url.pathname}/{listKey}"
			>
				<h3 class="text-xl mb-2">{capitalizeFirstLetter(listKey)}</h3>
				<DataView completionReport={global_lists_report.lists[listKey].listReport} />
			</a>
		{/each}
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
