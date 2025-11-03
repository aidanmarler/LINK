<script lang="ts">
	import type { ForwardTranslationInsert, SegmentMap } from '$lib/supabase/types';
	import { onMount } from 'svelte';
	import TranslateSegment from './translateSegment.svelte';
	import type { Profile, TranslationLanguage } from '$lib/types';
	import { InsertForwardTranslations } from '$lib/supabase/forwardTranslations';

	let { segmentMap, profile }: { segmentMap: SegmentMap; profile: Profile } = $props();

	// Translations to push - bind to translation segments
	let translationsToPush: Record<number, { translation: string; comment: string }> = $state({});

	onMount(() => {
		console.log('segmentMap!', segmentMap);
		Object.entries(segmentMap).forEach(([id, segmentData]) => {
			console.log('id...', id);
			if (!segmentData.forwardTranslation) {
				const numId = Number(id);
				if (!translationsToPush[numId]) {
					translationsToPush[numId] = { translation: '', comment: '' };
				}
				console.log(numId, translationsToPush);
			}
		});
	});

	async function handleSubmit() {
		const newForwardTranslations: ForwardTranslationInsert[] = [];

		for (const id in translationsToPush) {
			newForwardTranslations.push({
				original_id: Number(id),
				user_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation: translationsToPush[id].translation,
				comment: translationsToPush[id].comment,
				skipped: false
			});
		}
		console.log('newForwardTranslations', newForwardTranslations);

		InsertForwardTranslations(newForwardTranslations);

		return;
	}
</script>

<br />

{#each Object.entries(segmentMap) as [id, segmentData], i (id)}
	{#if segmentData.forwardTranslation}
		<!-- Complete -->
		<TranslateSegment
			completed={true}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			translation={segmentData.forwardTranslation.translation
				? segmentData.forwardTranslation.translation
				: ''}
			comment={segmentData.forwardTranslation.comment}
		/>
	{:else if Object.entries(translationsToPush).length > 0}
		<!-- Incomplete -->
		<TranslateSegment
			completed={false}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			bind:translation={translationsToPush[Number(id)].translation}
			bind:comment={translationsToPush[Number(id)].comment}
		/>{/if}
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
