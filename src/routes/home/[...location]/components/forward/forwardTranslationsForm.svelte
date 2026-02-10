<script lang="ts">
	import type { ForwardTranslationInsert, SegmentMap } from '$lib/supabase/types';
	import { onMount } from 'svelte';
	import type { Profile, TranslationLanguage } from '$lib/types';
	import { invalidateAll } from '$app/navigation';
	import { button, style } from '$lib/styles';
	import { UpdateProgress_ForwardSubmission } from '$lib/supabase/translationProgress';
	import TranslateSegment from './translateSegment.svelte';
	import { InsertForwardTranslations } from '$lib/supabase/utils';

	let {
		segmentMap,
		profile,
		onsubmit
	}: {
		segmentMap: SegmentMap;
		profile: Profile;
		onsubmit: (shouldContinue: boolean) => Promise<void>;
	} = $props();

	let saving: boolean = $state(false);

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

	let saveCount: number = $derived.by(() => {
		return Object.values(translationsToPush).filter(
			(t) => t.translation.trim().length > 0 || t.skipped
		).length;
	});

	let translationsToPushFiltered = $derived.by(() => {
		return Object.fromEntries(
			Object.entries(translationsToPush).filter(
				([key, t]) => t.translation.trim().length > 0 || t.skipped
			)
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

		// Organize translation to push
		for (const id in translationsToPush) {
			// Skip Translations if skip is pressed
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

			// Ignore if no text data
			if (translationsToPush[id].translation == '') continue;

			// New Translation
			newForwardTranslations.push({
				original_id: Number(id),
				user_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation: translationsToPush[id].translation.trim(),
				comment: translationsToPush[id].comment.trim(),
				skipped: translationsToPush[id].skipped
			});
		}

		if (newForwardTranslations.length > 0) {
			// Insert new translations to supabase ForwardTranslations table
			await InsertForwardTranslations(newForwardTranslations);

			// Handle check translation progress for submitted translations
			await UpdateProgress_ForwardSubmission(newForwardTranslations);

			// Invalidate data so that it reloads current data.
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
			saving={false}
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
			saving={saving && Object.keys(translationsToPushFiltered).includes(id)}
			bind:translation={translationsToPush[Number(id)].translation}
			bind:comment={translationsToPush[Number(id)].comment}
			bind:skipped={translationsToPush[Number(id)].skipped}
		/>{/if}
	<br />
{/each}

<div class="w-full mt-2 justify-between max-w-2xl px-3 m-auto flex">
	<button
		onclick={async () => {
			saving = true;
			await handleSubmit(false);
			translationsToPush = {};
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
			saving = false;
		}}
		class="{button.stone} border-[3px] text-lg right-0 font-semibold {canSave
			? 'opacity-90 hover:opacity-100 hover:shadow-sm cursor-pointer ' + button.stoneHover
			: 'opacity-40'} px-4 rounded-xl"
	>
		Save ({saveCount})
	</button>

	<button
		onclick={async () => {
			saving = true;
			await handleSubmit(true);
			translationsToPush = {};
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
			saving = false;
		}}
		class="border-[3px] text-lg transition-transform duration-100 right-0 font-semibold opacity-90 hover:opacity-100 hover:shadow-sm cursor-pointer px-4 rounded-xl
		{button.green.default} {button.green.hover}"
	>
		{#if canSave}
			Save ({saveCount}) & Continue
		{:else}
			Continue
		{/if}
	</button>
</div>
