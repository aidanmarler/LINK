<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { button } from '$lib/styles';
	import { fly } from 'svelte/transition';
	import { supabase } from '../../supabaseClient';

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
			if (splitName.length == 1) {
				returnValue.main.add(d.title);
			}
			if (splitName.length === 2) {
				const [category, item] = splitName;
				// Create missing entry
				if (!returnValue.sub.has(category)) returnValue.sub.set(category, new Set<string>());
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

	let presetName = $derived(profile.selected_preset?.split('_')[1] ?? profile.selected_preset + "CRF");
	//let presetName = $derived(profile.selected_preset?.replace('_', ' '));
</script>

<div class="items-center border-inherit flex" bind:this={menuContainer}>
	<button
		onclick={() => {
			menuOpen = !menuOpen;
		}}
		class=" cursor-pointer border-inherit w-full px-5 hover:underline rounded-full {button.stoneHover} text-center"
		title="Change current document"><span class="text-stone-800">Document:</span> <span  class="font-semibold">{presetName} ▾</span></button
	>
	{#if menuOpen}
		<div
			transition:fly={{ y: 10, duration: 100 }}
			class=" bg-stone-300 border-2 mt-8 absolute shadow-lg p-2 max-w-80 shadow-stone-00/50 -translate-x-19 translate-y-1/2 z-30 rounded-xl  border-inherit font-normal"
		>
			<!-- Main documents (ARC)-->
			<div class="items-center justify-center w-full flex">
				{#each ordedDocuments.main as title}
					{@const selected = title == profile.selected_preset}
					{@const toolTip = selected ? '' : 'Review ' + title}
					<button
						title={toolTip}
						class="px-3 border-2 mr-1 text-lg text-left {selected
							? button.giro.inactive
							: button.giro.active}"
						onclick={() => handlePresetChange(title)}
					>
						{title}
					</button>
				{/each}
			</div>
			<!-- Main documents (ARC)-->
			{#each ordedDocuments.sub as [label, section]}
				<div class="flex text-center items-center justify-center">
					{#if label == 'ARChetype Disease CRF'}
						<div class="justify-center mt-2 items-center text-center text-lg">
							{#each section as title}
								{@const selected = label + '_' + title == profile.selected_preset}
								{@const toolTip = selected ? '' : 'Review ' + label + ': ' + title}
								<button
									title={toolTip}
									class="px-3 border-2 mr-1 mb-1 text-left {selected
										? button.giro.inactive
										: button.giro.active}"
									onclick={() => handlePresetChange(label + '_' + title)}
								>
									{title}
								</button>
							{/each}
						</div>
					{:else}
						<div class="flex align-middle items-center">
							{label}:
						</div>

						<div class=" p-1 rounded-md border-inherit gap-0.5 font-normal">
							{#each section as title}
								{@const selected = label + '_' + title == profile.selected_preset}
								{@const toolTip = selected ? '' : 'Review ' + label + ': ' + title}
								<button
									title={toolTip}
									class="px-3 border-2 mr-1 mb-1 text-left {selected
										? button.giro.inactive
										: button.giro.active}"
									onclick={() => handlePresetChange(label + '_' + title)}
								>
									{title}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
