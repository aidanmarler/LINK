<script lang="ts">
	import type { RelatedTranslations, SegmentMap } from '$lib/supabase/types';
	import { onMount } from 'svelte';
	import type { Profile, TranslationLanguage } from '$lib/types';
	import { button } from '$lib/styles';
	import ReviewSegment from './reviewSegment.svelte';
	import { countComments, getRelatedTranslations, handleSubmit } from './reviewForm';

	let {
		segmentMap,
		profile,
		onsubmit
	}: {
		segmentMap: SegmentMap;
		profile: Profile;
		onsubmit: (shouldContinue: boolean) => Promise<void>;
	} = $props();

	// Store if actively saving to LINK database
	let saving: boolean = $state(false);

	// Store translations related to the set of original ids
	let relatedTranslations: RelatedTranslations = $state({});

	// Translations to push - bind to translation segments
	let reviewsToPush: Record<
		number,
		{
			translation_id: number | string | null;
			comments: Record<number, string | null>;
			ftranslation: string | null;
			fcomment: string | null;
		}
	> = $state({});

	let errors: Record<number, string> = $state({});

	//$inspect(reviewsToPush, relatedTranslations);

	// Reviewer can save review if a translation is suggested or a comment is given.
	// AIDAN: this can be an issue... Shouldn't we also allow a submission if a forward translation is provided?
	let canSave: boolean = $derived.by(() => {
		return Object.values(reviewsToPush).some(
			(r) => r.translation_id || countComments(r.comments) > 0
		);
	});

	let saveCount: number = $derived.by(() => {
		return Object.values(reviewsToPush).filter(
			(r) => r.translation_id || countComments(r.comments) > 0
		).length;
	});

	let reviewsToPushFiltered = $derived.by(() => {
		return Object.fromEntries(
			Object.entries(reviewsToPush).filter(
				([key, r]) => r.translation_id || countComments(r.comments) > 0
			)
		);
	});

	$inspect(reviewsToPushFiltered);

	onMount(async () => {
		// set up review to push
		initializeReviewsToPush();
		// pull related translations
		relatedTranslations = await getRelatedTranslations(
			Object.keys(segmentMap).map(Number),
			profile.language as TranslationLanguage
		);
	});

	// Set up blank reviews "To be reviewed" by itterating through data provided
	function initializeReviewsToPush() {
		reviewsToPush = {};
		for (const [id, segmentData] of Object.entries(segmentMap)) {
			// skip if review already submitted...
			if (segmentData.translationReview) continue;
			// Set blank review in reviews to push
			reviewsToPush[+id] = {
				translation_id: null,
				comments: {},
				fcomment: null,
				ftranslation: null
			};
		}
	}
</script>

{#each Object.entries(segmentMap) as [id, segmentData], i (id)}
	{#if segmentData.translationReview}
		<!-- Complete -->
		<ReviewSegment
			completed={true}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			options={relatedTranslations[+id]}
			error={undefined}
			saving={false}
			selectedTranslation={segmentData.translationReview.translation_id}
			comments={segmentData.translationReview.comments as Record<number, string | null>}
			ftranslation={null}
			fcomment={null}
		/>
	{:else if Object.entries(reviewsToPush).length > 0}
		<!-- Incomplete -->
		<ReviewSegment
			completed={false}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			options={relatedTranslations[+id]}
			error={errors[+id]}
			saving={saving && Object.keys(reviewsToPushFiltered).includes(id)}
			bind:selectedTranslation={reviewsToPush[Number(id)].translation_id}
			bind:comments={reviewsToPush[Number(id)].comments}
			bind:ftranslation={reviewsToPush[Number(id)].ftranslation}
			bind:fcomment={reviewsToPush[Number(id)].fcomment}
		/>
	{/if}
	<br />
{/each}

<div class="w-full mt-2 justify-between max-w-2xl px-3 m-auto flex">
	<button
		onclick={async () => {
			saving = true;
			const newErrors = await handleSubmit($state.snapshot(reviewsToPush), profile);
			if (newErrors) errors = newErrors;
			// set up review to push
			initializeReviewsToPush();
			// pull related translations
			relatedTranslations = await getRelatedTranslations(
				Object.keys(segmentMap).map(Number),
				profile.language as TranslationLanguage
			);
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
			if (canSave) {
				saving = true;
				const newErrors = await handleSubmit($state.snapshot(reviewsToPush), profile);
				if (newErrors) errors = newErrors;
				saving = false;
			}
			await onsubmit(true);
		}}
		class=" border-[3px] text-lg right-0 font-semibold px-4 rounded-xl cursor-pointer
		{button.green.default} {button.green.hover} "
	>
		{#if saveCount > 0}
			Save ({saveCount}) & Continue
		{:else}Continue{/if}
	</button>
</div>
