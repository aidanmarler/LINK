<script lang="ts">
	import type {
		RelatedTranslations,
		SegmentData,
		SegmentMap,
		TranslationReviewRow
	} from '$lib/supabase/types';
	import { onMount } from 'svelte';
	import type { Profile } from '$lib/types';
	import { button } from '$lib/styles';
	import { sortSegmentMap } from '$lib/utils/utils';
	import TranslateSegment from './forward/translateSegment.svelte';
	import PlaceholderSegment from './placeholderSegment.svelte';
	import { loading } from '../../../components/loading/loadingState.svelte';
	//import { getRelatedReviews, getRelatedTranslations } from './review/reviewForm';
	import {
		blankPageTranslations,
		blankTranslationVariables,
		getCompositeForm,
		handlePageTranslationSubmission,
		initPageTranslations,
		transformPageForSubmission,
		type PageSubmissions,
		type PageTranslations,
		type TranslationVariables
	} from './compositeForm';
	import ReviewSegment from './review/reviewSegment.svelte';
	import { invalidate } from '$app/navigation';

	let {
		segmentMap,
		profile,
		onsubmit,
		relatedReviewsProm,
		relatedTranslationsProm
	}: {
		segmentMap: SegmentMap;
		profile: Profile;
		onsubmit: (shouldContinue: boolean, forward: boolean) => Promise<void>;
		relatedReviewsProm: Promise<Record<number, TranslationReviewRow[]>>;
		relatedTranslationsProm: Promise<RelatedTranslations>;
	} = $props();

	let saving: boolean = $state(false);

	// Store translations related to the set of original ids
	let pageTranslations: PageTranslations = $state(blankPageTranslations());
	let relatedTranslations: RelatedTranslations = $state({});
	let relatedReviews: Record<number, TranslationReviewRow[]> = $state({});

	//let combined = Promise.all([relatedTranslationsProm, relatedReviewsProm]);

	let errors: Record<number, string> = $state({});
	let segmentsEditing: Record<number, boolean> = $state({});

	// Calculate what will be submitted
	let pageSubmissions: PageSubmissions = $derived.by(() =>
		transformPageForSubmission(
			$state.snapshot(pageTranslations),
			sortedSegments,
			segmentsEditing,
			profile
		)
	);

	let changed: Set<number> = $derived.by(() => {
		let ids: Set<number> = new Set();
		ids = new Set([...ids, ...pageSubmissions.forwardPush.map((r) => r.original_id)]);
		ids = new Set([...ids, ...pageSubmissions.forwardEdit.map((r) => r.original_id)]);
		ids = new Set([...ids, ...pageSubmissions.reviewPush.map((r) => r.original_id)]);
		ids = new Set([...ids, ...pageSubmissions.reviewEdit.map((r) => r.original_id)]);

		return ids;
	});

	let changeCount = $derived(changed.size);

	// Check if form can be saved
	let canSave: boolean = $derived(changeCount > 0);

	// Order segments by type
	let sortedSegments: [number, SegmentData][] = $derived.by(() => sortSegmentMap(segmentMap));

	let fsegments: number = $derived(Object.keys(pageTranslations.forwardPush).length);
	let rsegments: number = $derived(Object.keys(pageTranslations.reviewPush).length);
	let pageTitle: string = $derived(
		(sortedSegments[0][1].originalSegment.type == 'formLabel'
			? 'Form: '
			: sortedSegments[0][1].originalSegment.type == 'sectionLabel'
				? 'Section: '
				: '') + sortedSegments[0][1].originalSegment.segment.split(':')[0]
	);

	// & Initialize comments from an empty object to showing each review that was considered
	const initializeReviewCommentsToPush = (page: PageTranslations): PageTranslations => {
		// For each original segment,
		for (const oid in page.reviewPush) {
			for (const t in relatedTranslations[+oid]) {
				const tid = relatedTranslations[+oid][t][0].id;
				page.reviewPush[+oid].comments[tid] = null;
			}
		}
		return page;
	};

	let _forwardIds: number[] = $derived(
		Object.keys(segmentMap).flatMap((i) => {
			const form = getCompositeForm($state.snapshot(pageTranslations), +i);
			if (form == 'forwardPush') return [+i];
			return [];
		})
	);

	//let allSuggestions = $derived.by(() => getSuggestedTranslations(forwardIds, profile.id));

	let profileId = $derived(profile.id);

	onMount(async () => {
		/* 
			@ pull this data on page load or with hover function, not on component mount.
		
		
		// pull related translations
		relatedTranslations = await getRelatedTranslations(
			Object.keys(segmentMap).map(Number),
			profile.language as TranslationLanguage
		);
		relatedReviews = await getRelatedReviews(
			Object.keys(segmentMap).map(Number),
			profile.language as TranslationLanguage
		);*/

		//[pageTranslations, segmentsEditing] = initPageTranslations(segmentMap, relatedReviews);
		/*
		console.time('related-old');
		[relatedTranslations, relatedReviews] = await Promise.all([
			getRelatedTranslations(
				Object.keys(segmentMap).map(Number),
				profile.language as TranslationLanguage
			),
			getRelatedReviews(
				Object.keys(segmentMap).map(Number),
				profile.language as TranslationLanguage
			)
		]);
		console.timeEnd('related-old');
*/

		loading.active = true;
		loading.message = 'Pulling related data...';
		console.time('related-new');
		[relatedTranslations, relatedReviews] = await Promise.all([
			relatedTranslationsProm,
			relatedReviewsProm
		]);
		console.timeEnd('related-new');

		[pageTranslations, segmentsEditing] = initPageTranslations(segmentMap, relatedReviews);

		// pull other reviews for these segments
		initializeReviewCommentsToPush(pageTranslations);
		loading.active = false;
	});

	async function handleSubmit(shouldContinue: boolean, forward: boolean) {
		//console.log('changeCount: ', changeCount);

		if (changeCount > 0) {
			loading.active = true;
			loading.message = 'Submitting...';
			// Handle organizing and submitting changes to SupaBase
			await handlePageTranslationSubmission(pageSubmissions, profile, changed);

			loading.message = 'Reloading...';
			// Reload data
			await invalidate('app:data');
			loading.active = false;
		}

		for (const k of Object.keys(segmentsEditing)) {
			segmentsEditing[+k] = false;
		}

		// Tell page to move through tree
		if (shouldContinue) await onsubmit(shouldContinue, forward);

		return;
	}

	/*
	function getNextSlug(forward: boolean){
		const segs = initializeTraversal(resolvedData.locationTree, data.pathSegments, forward);
		if (!segs) return null;
		const nextSegment = segs.reverse()[0];
		if (!nextSegment)  return null;
		const nextSlug = getSegmentSlug(
			nextSegment?.segmentIds[0],
			resolvedData.locationTree,
			'/home'
		);
		return nextSlug;
	}

	function warmContinue(){}*/
</script>

<h1 class="font-semibold text-3xl text-center my-4 ml-5 text-stone-600 dark:text-stone-400">
	{pageTitle}
</h1>
<p class="font-normal flex text-md px-20 justify-center text-stone-700 dark:text-stone-300">
	<span class=" {fsegments == 0 ? 'opacity-30' : ''} gap-1 inline-flex items-center px-4 mr-1">
		<span
			class=" mr-0.5 rounded-full w-2 h-2 {fsegments == 0
				? 'bg-stone-500/40 '
				: 'bg-green-700/40 '}"
		></span>
		Translate <b>{fsegments}</b>
		<!--segment{fsegments == 1 ? '' : 's'}-->
	</span>
	<span class="{rsegments == 0 ? 'opacity-30' : ''} gap-1 inline-flex items-center px-4 ml-1">
		<span
			class="mr-0.5 rounded-full w-2 h-2 {rsegments == 0 ? 'bg-stone-500/40 ' : 'bg-sky-500/40'}"
		></span>
		Review <b>{rsegments}</b>

		<!--segment{rsegments == 1 ? '' : 's'}-->
	</span>
</p>
<br />

{#each sortedSegments as [id, segmentData], _i (id)}
	{@const form = getCompositeForm($state.snapshot(pageTranslations), id)}
	<!--{form}-->
	{@const reviews = relatedReviews[+id] ?? []}
	{#if form == 'forwardPush'}
		<TranslateSegment
			{id}
			{profileId}
			completed={false}
			canEdit={false}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			saving={saving && pageSubmissions.reviewPush.map((r) => r.original_id).includes(id)}
			submittedData={blankTranslationVariables()}
			editing={false}
			bind:newData={pageTranslations.forwardPush[id]}
		/>
	{:else if form == 'forwardEdit' && segmentData.forwardTranslation}
		{@const submittedData: TranslationVariables = { 
				translation: segmentData.forwardTranslation.translation ?? '',
				comment:segmentData.forwardTranslation.comment,
				skipped:segmentData.forwardTranslation.skipped
			}}
		<TranslateSegment
			{id}
			{profileId}
			completed={true}
			open={true}
			canEdit={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			saving={false}
			{submittedData}
			bind:editing={segmentsEditing[id]}
			bind:newData={pageTranslations.forwardEdit[id]}
		/>
	{:else if form == 'forwardLocked' && segmentData.forwardTranslation}
		{@const submittedData: TranslationVariables = { 
				translation: segmentData.forwardTranslation.translation ?? '',
				comment:segmentData.forwardTranslation.comment,
				skipped:segmentData.forwardTranslation.skipped
			}}
		<TranslateSegment
			{id}
			{profileId}
			completed={true}
			open={true}
			canEdit={false}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			saving={false}
			{submittedData}
			editing={false}
			newData={blankTranslationVariables()}
		/>
	{:else if form == 'reviewPush'}
		<ReviewSegment
			completed={false}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			options={relatedTranslations[+id]}
			relatedReviews={reviews}
			error={errors[+id]}
			saving={saving && pageSubmissions.reviewPush.map((r) => r.original_id).includes(id)}
			bind:selectedTranslation={pageTranslations.reviewPush[id].translation_id}
			bind:comments={pageTranslations.reviewPush[id].comments}
			bind:ftranslation={pageTranslations.reviewPush[id].ftranslation}
			bind:fcomment={pageTranslations.reviewPush[id].fcomment}
		/>
	{:else if form == 'reviewEdit' && segmentData.translationReview}
		<ReviewSegment
			completed={true}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			options={relatedTranslations[+id]}
			relatedReviews={reviews}
			error={undefined}
			saving={false}
			selectedTranslation={segmentData.translationReview.translation_id}
			comments={segmentData.translationReview.comments as Record<number, string | null>}
			ftranslation={null}
			fcomment={null}
		/>
	{:else if form == 'reviewLocked' && segmentData.translationReview}
		<ReviewSegment
			completed={true}
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
			options={relatedTranslations[+id]}
			relatedReviews={reviews}
			error={undefined}
			saving={false}
			selectedTranslation={segmentData.translationReview.translation_id}
			comments={segmentData.translationReview.comments as Record<number, string | null>}
			ftranslation={null}
			fcomment={null}
		/>
	{:else}
		<PlaceholderSegment
			open={true}
			label={segmentData.originalSegment.type}
			segment={segmentData.originalSegment.segment}
		/>
	{/if}
	<br />
{/each}

<!-- Back, Save, Continue -->

<div class="w-full mt-2 justify-between px-3 m-auto flex">
	<!-- Back -->
	<button
		data-sveltekit-preload-data="hover"
		onclick={async () => {
			saving = true;
			await handleSubmit(true, false);
			/*
			DEPtranslationsToPush = {};
			Object.entries(segmentMap).forEach(([id, segmentData]) => {
				if (!segmentData.forwardTranslation) {
					if (!DEPtranslationsToPush[+id]) {
						DEPtranslationsToPush[+id] = { translation: '', comment: '', skipped: false };
					}
				}
			});*/
			saving = false;
		}}
		class="text-lg border-[3px] transition-transform duration-100 right-0 font-semibold opacity-90 hover:opacity-100 hover:shadow-sm cursor-pointer px-4 rounded-xl
		 {button.stone} {button.stoneHover}"
	>
		{#if canSave}
			Save ({changeCount}) & Back
		{:else}
			Back
		{/if}
	</button>

	<!-- Save -->
	<button
		onclick={async () => {
			saving = true;
			await handleSubmit(false, false);
			/*
			DEPtranslationsToPush = {};
			Object.entries(segmentMap).forEach(([id, segmentData]) => {
				//console.log('id...', id);
				if (!segmentData.forwardTranslation) {
					const numId = Number(id);
					if (!DEPtranslationsToPush[numId]) {
						DEPtranslationsToPush[numId] = { translation: '', comment: '', skipped: false };
					}
					//console.log(numId, translationsToPush);
				}
			});*/
			saving = false;
		}}
		class="{button.stone}  text-lg right-0 font-semibold {canSave
			? 'opacity-90 hover:opacity-100 hover:shadow-sm cursor-pointer ' + button.stoneHover
			: 'opacity-40'} px-4 rounded-xl"
	>
		Save ({changeCount})
	</button>

	<!-- Save & Continue -->
	<button
		data-sveltekit-preload-data="hover"
		onclick={async () => {
			saving = true;
			await handleSubmit(true, true);
			/*
			DEPtranslationsToPush = {};
			Object.entries(segmentMap).forEach(([id, segmentData]) => {
				if (!segmentData.forwardTranslation) {
					if (!DEPtranslationsToPush[+id]) {
						DEPtranslationsToPush[+id] = { translation: '', comment: '', skipped: false };
					}
				}
			});*/
			saving = false;
		}}
		class="border-[3px] text-lg transition-transform duration-100 right-0 font-semibold opacity-90 hover:opacity-100 hover:shadow-sm cursor-pointer px-4 rounded-xl
		{button.green.default} {button.green.hover}"
	>
		{#if canSave}
			Save ({changeCount}) & Continue
		{:else}
			Continue
		{/if}
	</button>
</div>
