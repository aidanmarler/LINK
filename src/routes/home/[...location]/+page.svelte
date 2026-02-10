<script lang="ts">
	import { goto } from '$app/navigation';
	import { button } from '$lib/styles';
	import type { SegmentMap } from '$lib/supabase/types.js';
	import type { Profile, UserForm } from '$lib/types.js';
	import { findNextSegment } from '$lib/utils/nextSegment';
	import { fade, fly } from 'svelte/transition';
	import CompletionChart from './completionChart.svelte';
	import ForwardTranslationsForm from './components/forward/forwardTranslationsForm.svelte';
	import { makeFolderLabel } from '$lib/utils/utils';
	import TranslationReviewForm from './components/review/reviewForm.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	let currentForm: UserForm = $state('Forward Translate');

	const forms: UserForm[] = ['Forward Translate', 'Review']; //'Backward Translate'
	// Store
	const formStepMap: Record<UserForm, string> = {
		'Forward Translate': 'forward',
		'Backward Translate': 'backward',
		Review: 'review'
	};

	// On submit, handle redirect if "shouldContinue" is true
	async function onsubmit(shouldContinue: boolean) {
		if (!shouldContinue) return; // ignore if only a "save"

		const resolvedData = await data.dataPromise; // get current data

		// find next segment
		const nextSegment = findNextSegment(
			resolvedData.locationTree,
			resolvedData.segmentMap,
			'/home',
			data.currentNode
		);

		// if next segment found, go to it
		if (nextSegment) {
			await goto(nextSegment, { invalidateAll: true });
		} else {
			return;
		}
	}
</script>

{#await data.dataPromise}
	<div>Loading...</div>
{:then resolvedData}
	{@const currentNode = data.currentNode}
	<!-- Get heirarchy location data -->
	{@const segmentMap = resolvedData.segmentMap}
	<!-- Get Segment Map -->
	{@const currentPath =
		data.pathSegments.length > 0 ? `/home/${data.pathSegments.join('/')}` : '/home'}
	<!-- Make URL -->
	{@const profile = data.profile as Profile}
	<!-- Get Uer profile -->

	<!-- Now, filter down segments on this page and sort them by step -->
	{@const pageSegments:  Record<string, SegmentMap> = (() => {
		console.log('loading pageSegments...');
		if (!currentNode) return {} as SegmentMap;
		// Store segmentMap for each translation step
		const sorted: Record<string, SegmentMap> = {'forward': {}, 'review': {}, 'backward': {}};

		// iterate through segment ids attached to this node on the tree	
		for (const id of currentNode.segmentIds) {
			const segmentData = segmentMap[id];
			// if segment exists...
			if (segmentData) {
				// if you've already done one of the things, add it to the map (so people can see their progress)
				if(segmentData.forwardTranslation) sorted['forward'][id] = segmentData;
				if(segmentData.translationReview) sorted['review'][id] = segmentData;
				//if(segmentData.backwardTranslation) sorted['backward'][id] = segmentData; // add when backward translation is supported
				
				// otherwise, if translationProgress suggests they should do something and they haven't, also add it there.
				if (segmentMap[id].translationProgress) {
					const step = segmentMap[id].translationProgress
						? segmentMap[id].translationProgress.translation_step
						: 'forward';
					if (!sorted[step][id]) {
						sorted[step][id] = segmentData;
					}
				}

				// If no translationProgress, assume it is a forward translation
				else if (!sorted['forward'][id]) {
					sorted['forward'][id] = segmentData;
				}
				
			}
		}
		return sorted;
	})()}

	<!-- From pageSegments, get how many need to be completed-->
	{@const formToDoCount: Record<string, number> = (() => {
		const counts: Record<string, number> = { forward: 0, review: 0, backward: 0 };
		for (const id of Object.keys(pageSegments['forward'])) {
			if (pageSegments['forward'][+id].forwardTranslation) continue;
			counts["forward"] += 1;
		}
		for (const id of Object.keys(pageSegments['review'])) {
			if (pageSegments['review'][+id].translationReview) continue;
			counts.review += 1;
		}
		return counts;
	})()}

	{#if data.notFound}
		<div>
			<h1>Location Not Found</h1>
			<a href="/home">Return to Home</a>
		</div>
	{:else if currentNode}
		<!--
			Navigations!
		Here is where we show all next locations
		  -->
		{#if currentNode.children.size > 0}
			<section>
				{#key currentPath}
					<div
						in:fly|global={{ x: 10, duration: 200, delay: 100 }}
						out:fly|global={{ x: -10, duration: 100 }}
						class="grid p-2 gap-2 sm:grid-cols-2"
					>
						{#each [...currentNode.children.values()] as child}
							<!--<h2>Filter data to only </h2>-->
							{@const nodeSegments = (() => {
								if (!currentNode) return {} as SegmentMap;

								const filtered: SegmentMap = {};
								for (const id of currentNode.segmentIds) {
									if (segmentMap[id]) {
										filtered[id] = segmentMap[id];
									}
								}
								return segmentMap;
							})()}
							<button
								title="See {child.slug}"
								class="w-full cursor-pointer {button.stanley}  p-2 rounded-lg"
								onclick={() => {
									goto(currentPath + '/' + child.slug);
								}}
							>
								<p class="w-full text-center">{makeFolderLabel(child.name)}</p>
								<div class="w-full px-2">
									<CompletionChart completion={child.completion} options={{ showKey: true }} />
								</div>
							</button>
						{/each}
					</div>
				{/key}
			</section>
		{/if}

		<!-- Segments at this location -->
		<!-- Forms for interacting with segments -->
		{#if data.currentNode.segmentIds.length > 0}
			<section>
				<div
					in:fade|global={{ duration: 200, delay: 100 }}
					out:fade|global={{ duration: 100 }}
					class="text-lg flex justify-center"
				>
					<!-- Select which form to show -->
					{#each forms as form}
						<label
							class=" hover:underline cursor-pointer px-2 rounded-full {currentForm == form
								? '  '
								: 'opacity-50 '}"
						>
							<input
								class=""
								type="radio"
								name="currentForm"
								value={form}
								bind:group={currentForm}
							/>

							<!-- Label the form - also add number next to it for number of segments found! -->
							<span class="mr-2">{form} ({formToDoCount[formStepMap[form]]})</span>
						</label>
					{/each}
				</div>
				<div
					in:fly|global={{ x: 10, duration: 200, delay: 100 }}
					out:fly|global={{ x: -10, duration: 100 }}
				>
					{#if currentForm == 'Forward Translate'}
						{#key currentPath}
							<ForwardTranslationsForm segmentMap={pageSegments['forward']} {profile} {onsubmit} />
						{/key}
					{:else if currentForm == 'Review'}
						<TranslationReviewForm segmentMap={pageSegments['review']} {profile} {onsubmit} />
					{:else if currentForm == 'Backward Translate'}
						<p class="w-full text-center text-xl mt-10">Backward Translation is Coming Soon!</p>
					{/if}
				</div>
			</section>
		{/if}
	{/if}
{:catch error}
	<!-- Error state -->
	<div class="p-8 font-medium text-red-800 dark:text-red-400">
		<h2>Error loading data</h2>
		<p>{error.message}</p>
	</div>
{/await}
