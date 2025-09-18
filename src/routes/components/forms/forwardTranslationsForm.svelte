<script lang="ts">
	import { updateGlobalTables, userProfile } from '$lib/global.svelte';
	import { addItems } from '$lib/supabase/user';
	import {
		VariableCategory_Labels,
		type BaseRow,
		type ForwardTranslation,
		type Item,
		type Row,
		type Table,
		type TranslationLanguage,
		type UserComment
	} from '$lib/types';
	import TranslateSegment from './translateSegment.svelte';

	let {
		forwardTranslations
	}: {
		forwardTranslations: Record<string, ForwardTranslation[]>;
	} = $props();

	let translationsToPush: Partial<Record<Table, ForwardTranslation[]>> = {};

	async function handleSubmit() {
		if (!userProfile.user) return Error();
		// Collect only translations that have been changed (non-empty translation field)
		translationsToPush = {};

		const addedSegments = new Set<string>();

		Object.entries(forwardTranslations).forEach(([section, translations]) => {
			translations.forEach((translation) => {
				if (translation.item.translation.trim() !== '' && !translation.completed) {
					// Check if this segment has already been added
					if (addedSegments.has(translation.item.segment)) {
						return; // Skip if already added
					}

					// Mark this segment as added
					addedSegments.add(translation.item.segment);

					const table = translation.table;
					if (!translationsToPush[table]) {
						translationsToPush[table] = [];
					}
					translationsToPush[table]!.push(translation);
				}
			});
		});

		console.log('pushing translations...');

		console.log('translationsToPush', translationsToPush);

		for (const [table, translations] of Object.entries(translationsToPush)) {
			if (!userProfile.user) return Error();
			const items = translations.map((translation) => ({
				...(translation.item satisfies Item),
				comment: translation.comment
			}));

			const result = await addItems(
				userProfile.user.id,
				table as Table,
				items as (Item & UserComment)[]
			);

			if (result instanceof Error) {
				console.error(`Failed to insert into ${table}:`, items, result);
				return Error();
				// Handle error (show notification, etc.)
			} else {
				console.log(`Successfully inserted into ${table}!`);
			}
		}

		console.log('All translations processed successfully!');
		if (!userProfile.user) return Error();
		updateGlobalTables(userProfile.user.language as TranslationLanguage);
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
			completed={translation.completed}
			open={translation.open}
			label={VariableCategory_Labels[translation.category]}
			segment={translation.item.segment}
			bind:translation={translation.item.translation}
			bind:comment={translation.comment}
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
