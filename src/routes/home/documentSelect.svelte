<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { button } from '$lib/styles';
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

	async function handlePresetChange(preset: null | string) {
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

	//let archVersion: string = $state('1.1.5');
	//let archVersion: string = $derived(documents.find((d) => d.version));

	let archVersion: string = $derived(
		documents.reduce((best, d) => (d.version > best ? d.version : best), '')
	);


	$inspect(archVersion);

	//let newDocuments = $derived.by(()=>{
	//	for (const doc of documentMap)
	//	documents
	//})

	/*
	let newMap = $derived.by(() => {
		const versionMap: Map<string, { main: string[]; sub: Map<string, string[]> }> = new Map();
		const initial = Object.entries(documentMap);
		for (const [name, docs] of initial) {
			const sName = name.split('_');
			for (const doc of docs) {
				// init a new version map
				if (!versionMap.has(doc.version)) {
					versionMap.set(doc.version, { main: [], sub: new Map() });
				}

				// + store map entry
				const entry = versionMap.get(doc.version)!;

				// * If no subtype, add to map with key to version
				if (sName.length == 1) {
					// No underscore — add name to main if not already there
					if (!entry.main.includes(name)) {
						entry.main.push(name);
					}
				} else if (sName.length === 2) {
					const [category, item] = sName;
					// Get existing sub-array or create it
					if (!entry.sub.has(category)) {
						entry.sub.set(category, []);
					}
					const subList = entry.sub.get(category)!;
					if (!subList.includes(item)) {
						subList.push(item);
					}
				}
			}
		}

		/*
		const versionMapSorted =...
        insert version by alphabetical
        insert main values by alphabetical
        insert sublists by alphabetical
        insert sublist values by alphabetical
        
		// Sort the versionMap alphabetically at all levels
		const versionMapSorted: Map<string, { main: string[]; sub: Map<string, string[]> }> = new Map(
			[...versionMap.entries()]
				.sort(([a], [b]) => b.localeCompare(a))
				.map(([version, entry]) => [
					version,
					{
						main: [...entry.main].sort((a, b) => a.localeCompare(b)),
						sub: new Map(
							[...entry.sub.entries()]
								.sort(([a], [b]) => a.localeCompare(b))
								.map(([category, items]) => [
									category,
									[...items].sort((a, b) => a.localeCompare(b))
								])
						)
					}
				])
		);

		return versionMapSorted;
	});*/

	let ordedDocuments = $derived.by(() => {
		const returnValue = { main: new Set(), sub: new Map() };
		for (const d of documents) {
			if (d.version !== archVersion) continue;

			const splitName = d.title.split('_');
			if (splitName.length == 1) {
				returnValue.main.add(d.title);
			}
			if (splitName.length === 2) {
				const [category, item] = splitName;
				// Create missing entry
				if (!returnValue.sub.has(category)) returnValue.sub.set(category, new Set());
				returnValue.sub.get(category).add(item);
			}
		}

		return returnValue;
	});
</script>

<div class="p-1 border-inherit font-normal">
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
<!--
<div
	class="text-xl w-full font-semibold text-center mx-auto max-w-80 py-3 rounded-2xl border-inherit"
>
	ARC Version:
	<select
		bind:value={archVersion}
		class="px-3 m-1 text-left border-2 border-inherit {button.simple.active}"
	>
		{#each newMap.keys() as version}
			<option>{version}</option>
		{/each}
	</select>
</div>
-->
<!--
		
<!--
	{#each newMap.get(archVersion)?.sub as [label, section]}
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
	-->
