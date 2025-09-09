<script lang="ts">
	import { VariableCategory_Labels, type ForwardTranslation, type Table } from '$lib/types';
	import TranslateSegment from './translateSegment.svelte';

	let {
		forwardTranslations
	}: {
		forwardTranslations: Record<string, ForwardTranslation[]>;
	} = $props();

	let translationsToPush: Partial<Record<Table, ForwardTranslation[]>> = {};

	function handleSubmit() {
		// Collect only translations that have been changed (non-empty translation field)
		translationsToPush = {};

		Object.entries(forwardTranslations).forEach(([section, translations]) => {
			translations.forEach((translation) => {
				if (translation.item.translation.trim() !== '') {
					const table = translation.table;
					if (!translationsToPush[table]) {
						translationsToPush[table] = [];
					}
					translationsToPush[table]!.push(translation);
				}
			});
		});

		console.log('Translations to push:', translationsToPush);
	}
	// Function to filter and update segments based on category
	export function filterData(category: string, open: boolean) {
		console.log(`Filtering ${category} to ${open ? 'visible' : 'hidden'}`);
		// For each segment-open pair, see if segment is in category and if so, set 'open' to open
	}
</script>

<br />
{#each Object.entries(forwardTranslations) as [section, translations], i (section)}
	<h1 class="text-lg font-light">{section}</h1>
	{#each translations as translation, j (j)}
		<TranslateSegment
			open={translation.open}
			label={VariableCategory_Labels[translation.category]}
			segment={translation.item.segment}
			bind:translation={translation.item.translation}
		/>
	{/each}
	<br />
{/each}

<div class="w-full mt-2 justify-center flex">
	<button
		onclick={handleSubmit}
		class="border-[3px] text-lg justify-right right-0 font-semibold border-green-900 bg-green-700/20 opacity-90 hover:opacity-100 hover:bg-green-600/50 hover:shadow-sm px-4 cursor-pointer rounded-xl"
	>
		Submit Translations
	</button>
</div>
