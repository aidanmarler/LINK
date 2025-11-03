<script lang="ts">
	import { page } from '$app/state';
	import { formTableTree, global_address, loadedStatus, reset_address } from '$lib/global.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import DataView from '../../components/dataView.svelte';
	import { card_dynamic } from '$lib/styles';
	import { capitalizeFirstLetter, makeFolderLabel, makeFolderNav } from '$lib/utils/utils';

	onMount(() => {
		reset_address();
		global_address.category = 'Guides';
	});
</script>

{#if loadedStatus.guides && formTableTree.data}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
		class="grid grid-cols-1 sm:grid-cols-2 gap-3"
	>
		{#each Object.entries(formTableTree.data.forms) as [form], i (form)}
			<a
				data-sveltekit-preload-code="eager"
				class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col rounded-md text-center {card_dynamic}"
				href="{page.url.pathname}/{makeFolderNav(form)}"
			>
				<h3 class="text-xl mb-2">{makeFolderLabel(form)}</h3>
			</a>
		{/each}
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
