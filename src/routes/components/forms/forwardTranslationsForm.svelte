<script lang="ts">
	import type { ForwardTranslation, Table } from '$lib/types';
	import TranslateSegment from './translateSegment.svelte';

	let {
		forwardTranslations
	}: { forwardTranslations: Record<string, ForwardTranslation[]> } = $props();

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

		// Call your existing function to push to server
		console.log('Translations to push:', translationsToPush);
		// yourExistingPushFunction(translationsToPush);
	}
</script>

<br />
{#each Object.entries(forwardTranslations) as [section, translations], i (section)}
	<h1 class="text-lg font-light">{section}</h1>
	{#each translations as translation, j (j)}
		<TranslateSegment
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
