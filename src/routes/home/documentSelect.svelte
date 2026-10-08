<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { button, shadow } from '$lib/styles';
	import { fly } from 'svelte/transition';
	import { supabase } from '../../supabaseClient';
	import { generateDocumentName } from '$lib/utils/utils';
	import Info from './info.svelte';

	let {
		documents,
		profile
	}: {
		documents: { id: number; title: string; version: string }[];
		profile: {
			clinical_expertise: boolean | null;
			created_at: string;
			id: string;
			is_admin: boolean;
			language: string | null;
			name: string | null;
			profession: string | null;
			selected_preset: string | null;
		};
	} = $props();

	async function handlePresetChange(preset: undefined | string) {
		// Change this user's preset
		const { error } = await supabase
			.from('profiles')
			.update({ selected_preset: preset })
			.eq('id', profile.id);

		if (error) console.error(error);

		// Reload the page
		//window.location.href = 'home'; // Full page reload

		invalidateAll(); // This re-runs all load functions
	}

	const _archetypeStarts = ['Disease_', 'ARChetype Disease CRF_', 'ARC'];

	let archVersion: string = $derived(
		documents.reduce((best, d) => (d.version > best ? d.version : best), '')
	);

	let ordedDocuments = $derived.by(() => {
		const returnValue = { main: new Set<string>(), sub: new Map() };
		for (const d of documents) {
			if (d.version !== archVersion) continue;

			const splitName = d.title.split('_');

			if (d.title.includes('Mpox Pregnancy and ')) continue;
			if (splitName.length == 1) {
				returnValue.main.add(d.title);
			}
			if (splitName.length === 2) {
				const [category, item] = splitName;
				// Create missing entry
				if (!returnValue.sub.has(category)) {
					if (category.includes('Disease CRF'))
						returnValue.sub = new Map([[category, new Set<string>()], ...returnValue.sub]);
					else returnValue.sub.set(category, new Set<string>());
				}

				returnValue.sub.get(category).add(item);
			}
		}

		return returnValue;
	});

	let menuContainer: HTMLDivElement;
	let menuOpen = $state(false);

	// Handle clicks outside the menu
	function handleClickOutside(event: MouseEvent) {
		if (menuContainer && !menuContainer.contains(event.target as Node)) {
			menuOpen = false;
		}
	}

	// Add/remove event listener when menu opens/closes
	$effect(() => {
		if (menuOpen) {
			// Add listener on next tick to avoid immediate closure
			setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 0);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}

		// Cleanup function
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	let presetName = $derived(generateDocumentName(profile.selected_preset ?? ''));
</script>

{#snippet documentOption(
	toolTip: string,
	title: string,
	selected: boolean,
	preset: string,
	visualLabel: string
)}
	<button
		title={toolTip}
		class=" px-1.5 flex justify-between rounded-md items-center w-full active:bg-stone-100 dark:active:bg-stone-black
						{selected
			? ' opacity-70 bg-stone-400/50 '
			: '  cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-950 '}"
		onclick={() => handlePresetChange(preset)}
	>
		<span class="font-semibold">
			{title}
		</span>

		<span class="text-sm italic text-stone-700 dark:text-stone-500"> {visualLabel} </span>
	</button>
{/snippet}

<div class=" relative items-center border-inherit flex" bind:this={menuContainer}>
	<button
		onclick={() => {
			menuOpen = !menuOpen;
		}}
		class=" cursor-pointer border-inherit w-full px-5 hover:underline rounded-full {button.stone} {button.stoneHover} text-center"
		title="Change current document"
		><span class="text-stone-800 dark:text-stone-400">Document:</span>
		<span class="font-semibold">{presetName} ▾</span></button
	>
	{#if menuOpen}
		<div
			transition:fly={{ y: 10, duration: 150 }}
			class=" bg-stone-300 dark:bg-stone-900 border-2 border-stone-700 left-1/2 mr-1 -translate-1/2 mt-8 flex flex-col absolute shadow-lg p-1 w-90 max-w-90 translate-y-1/2 z-30 rounded-lg font-normal {shadow.color}"
		>
			<!-- Main documents (ARC)-->
			<div class="items-center justify-center w-full flex">
				{#each ordedDocuments.main as title}
					{@const selected = title == profile.selected_preset}
					{@const toolTip = selected ? '' : 'Review ' + title}

					{@render documentOption(toolTip, title, selected, title, 'Whole database')}
				{/each}
			</div>
			<!-- Main documents (ARC)-->
			{#each ordedDocuments.sub as [label, section]}
				<div class="items-center justify-center w-full flex-col flex">
					{#if label == 'ARChetype Disease CRF'}
						<hr class="w-full text-stone-400 dark:text-stone-700" />
						{#each section as title}
							{@const selected = label + '_' + title == profile.selected_preset}
							{@const toolTip = selected ? '' : 'Review ' + label + ': ' + title}
							{@const visualLabel = label.replace('ARChetype ', '')}

							{@render documentOption(toolTip, title, selected, label + '_' + title, visualLabel)}
						{/each}
					{:else}
						<hr class="w-full text-stone-400 dark:text-stone-700" />
						{#each section as title}
							{@const selected = label + '_' + title == profile.selected_preset}
							{@const toolTip = selected ? '' : 'Review ' + label + ': ' + title}
							{@const visualLabel = label.replace('ARChetype ', '')}
							{@render documentOption(toolTip, title, selected, label + '_' + title, visualLabel)}
						{/each}
					{/if}
				</div>
			{/each}

			<p
				title="ARC is in version {archVersion}"
				class="w-full flex font-semibold  items-center justify-center italic cursor-context-menu text-center text-sm text-stone-700 dark:text-stone-500"
			>
				<span class="h-4 w-4 mr-0.5">
					<Info />
				</span>

				<span>
					ARC v{archVersion}
				</span>
			</p>
		</div>
	{/if}
</div>
