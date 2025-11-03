<script lang="ts">
	import { page } from '$app/state';
	import {
		definitionTableTree,
		formTableTree,
		guideTableTree,
		loadedStatus,
		reset_address,
		sectionTableTree
	} from '$lib/global.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { capitalizeFirstLetter, makeFolderLabel, makeFolderNav } from '$lib/utils/utils';
	import { card_dynamic } from '$lib/styles';
	import DataView from '../../../components/dataView.svelte';

	let pathSegments = $derived(page.url.pathname.split('/').filter(Boolean));
	let crumb = $derived(pathSegments[pathSegments.length - 1]);

	let sections = $derived.by(() => {
		return guideTableTree.data.forms[crumb].sections;
	});

	onMount(() => {
		reset_address();
	});

	let buttonClass = 'bg-stone-400 px-5 hover:bg-stone-300 cursor-pointer  hover:shadow border';
</script>

<div
	in:fly|global={{ x: 10, duration: 200, delay: 100 }}
	out:fly|global={{ x: -10, duration: 100 }}
>
	<button
		class={buttonClass}
		onclick={() => {
			console.log('formTableTree', $state.snapshot(formTableTree.data));
		}}
	>
		formTableTree
	</button>

	<button
		class={buttonClass}
		onclick={() => {
			console.log('sectionTableTree', $state.snapshot(sectionTableTree.data));
		}}
	>
		sectionTableTree
	</button>

	<button
		class={buttonClass}
		onclick={() => {
			console.log('definitionTableTree', $state.snapshot(definitionTableTree.data));
		}}
	>
		definitionTableTree
	</button>

	<button
		class={buttonClass}
		onclick={() => {
			console.log('guideTableTree', $state.snapshot(guideTableTree.data));
		}}
	>
		guideTableTree
	</button>

	<button
		class={buttonClass}
		onclick={() => {
			console.log('pathSegments', $state.snapshot(pathSegments), $state.snapshot(sections));
		}}
	>
		data
	</button>
</div>

{#if loadedStatus.guides && sections}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
		class="grid grid-cols-1 sm:grid-cols-2 gap-3"
	>
		{#each Object.entries(sections) as [section], i (section)}
			<a
				data-sveltekit-preload-code="eager"
				class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col rounded-md text-center {card_dynamic}"
				href="{page.url.pathname}/{makeFolderNav(section)}"
			>
				<h3 class="text-xl mb-2">{makeFolderLabel(section)}</h3>
			</a>
		{/each}
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}

<!--
{#if loadedStatus.guides && formTableTree.data.forms}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
		class="grid grid-cols-1 sm:grid-cols-2 gap-3"
	>
		{#each Object.entries(formTableTree.data.forms) as [form], i (form)}
			<a
				data-sveltekit-preload-code="eager"
				class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col rounded-md text-center {card_dynamic}"
				href="{page.url.pathname}/{form}"
			>
				<h3 class="text-xl mb-2">{capitalizeFirstLetter(form.replaceAll('_', ' '))}</h3>
				<DataView
					completionReport={formTableTree.data.forms[form].completionReport}
					options={{ showKey: true }}
				/>
			</a>
		{/each}
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
-->
