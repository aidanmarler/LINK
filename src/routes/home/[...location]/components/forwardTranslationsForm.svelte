<script lang="ts">
	import type { ForwardTranslationInsert, SegmentMap } from '$lib/supabase/types';
	import { onMount } from 'svelte';
	import TranslateSegment from './translateSegment.svelte';
	import type { Profile, TranslationLanguage } from '$lib/types';
	import { InsertForwardTranslations } from '$lib/supabase/forwardTranslations';
	import { invalidateAll } from '$app/navigation';
	import { button, style } from '$lib/styles';

	let {
		segmentMap,
		profile,
		onsubmit
	}: {
		segmentMap: SegmentMap;
		profile: Profile;
		onsubmit: (shouldContinue: boolean) => Promise<void>;
	} = $props();

	// Translations to push - bind to translation segments
	let translationsToPush: Record<
		number,
		{ translation: string; comment: string; skipped: boolean }
	> = $state({});

	let canSave: boolean = $derived.by(() => {
		return Object.values(translationsToPush).some(
			(t) => t.translation.trim().length > 0 || t.skipped
		);
	});

	onMount(() => {
		//console.log('segmentMap!', segmentMap);
		Object.entries(segmentMap).forEach(([id, segmentData]) => {
			//console.log('id...', id);
			if (!segmentData.forwardTranslation) {
				const numId = Number(id);
				if (!translationsToPush[numId]) {
					translationsToPush[numId] = { translation: '', comment: '', skipped: false };
				}
				//console.log(numId, translationsToPush);
			}
		});
	});

	async function handleSubmit(shouldContinue: boolean) {
		const newForwardTranslations: ForwardTranslationInsert[] = [];

		for (const id in translationsToPush) {
			if (translationsToPush[id].skipped == true) {
				newForwardTranslations.push({
					original_id: Number(id),
					user_id: profile.id,
					language: profile.language as TranslationLanguage,
					translation: '',
					comment: translationsToPush[id].comment,
					skipped: translationsToPush[id].skipped
				});
			}
			if (translationsToPush[id].translation == '') continue;
			newForwardTranslations.push({
				original_id: Number(id),
				user_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation: translationsToPush[id].translation,
				comment: translationsToPush[id].comment,
				skipped: translationsToPush[id].skipped
			});
		}

		if (newForwardTranslations.length > 0) {
			await InsertForwardTranslations(newForwardTranslations);

			await invalidateAll();
		}

		if (shouldContinue) await onsubmit(shouldContinue);

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
			skipped={segmentData.forwardTranslation.skipped}
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
			bind:skipped={translationsToPush[Number(id)].skipped}
		/>{/if}
	<br />
{/each}

<div class="w-full mt-2 justify-between max-w-2xl px-3 m-auto flex">
	<button
		onclick={() => {
			handleSubmit(false);
		}}
		class="{button.stone} border-[3px] text-lg right-0 font-semibold {canSave
			? 'opacity-90 hover:opacity-100 hover:shadow-sm'
			: 'opacity-60'} px-4 cursor-pointer rounded-xl"
	>
		Save
	</button>

	<button
		onclick={() => {
			handleSubmit(true);
		}}
		class="{button.green} border-[3px] text-lg right-0 font-semibold {canSave
			? 'opacity-90 hover:opacity-100 hover:shadow-sm'
			: 'opacity-60'} px-4 cursor-pointer rounded-xl"
	>
		Save & Continue
	</button>
</div>
