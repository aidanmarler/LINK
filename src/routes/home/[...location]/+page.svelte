<script lang="ts">
	import { goto } from '$app/navigation';
	import { button } from '$lib/styles';
	import type { SegmentMap } from '$lib/supabase/types.js';
	import type { Profile, UserForm } from '$lib/types.js';
	import { findNextSegment } from '$lib/utils/nextSegment';
	import { fly } from 'svelte/transition';
	import CompletionChart from './completionChart.svelte';
	import ForwardTranslationsForm from './components/forward/forwardTranslationsForm.svelte';
	import { makeFolderLabel } from '$lib/utils/utils';
	import TranslationReviewForm from './components/review/reviewForm.svelte';
	import type { LocationNode } from '$lib/utils/locationTree';
	import { onMount } from 'svelte';

	let { data } = $props();

	let currentForm: UserForm = $state('Translate');

	const forms: UserForm[] = ['Translate', 'Review']; //'Backward Translate'

	const gotoState = history.state['sveltekit:states']['form'];

	onMount(() => {
		if (gotoState == 'forward') currentForm = 'Translate';
		else if (gotoState == 'review') currentForm = 'Review';
	});

	// Store
	const formStepMap: Record<UserForm, string> = {
		Translate: 'forward',
		'Backward Translate': 'backward',
		Review: 'review'
	};

	let formChildren = $derived(
		data.currentNode?.children
			.values()
			.filter((n) => n.tag == 'formLabel')
			.toArray()
	);
	let sectionChildren = $derived(
		data.currentNode?.children
			.values()
			.filter((n) => n.tag == 'sectionLabel')
			.toArray()
	);
	let nodeChildren = $derived(
		data.currentNode?.children
			.values()
			.filter((n) => n.tag != 'formLabel' && n.tag != 'sectionLabel')
			.toArray()
	);

	// On submit, handle redirect if "shouldContinue" is true
	async function onsubmit(shouldContinue: boolean) {
		if (!shouldContinue) return; // ignore if only a "save"

		console.log('onsubmit');

		const resolvedData = await data.dataPromise; // get current data

		console.log('find next segment');

		// find next segment
		const nextSegmentTuple = findNextSegment(
			resolvedData.locationTree,
			resolvedData.segmentMap,
			'/home',
			'forward',
			data.currentNode
		);
		const slug = nextSegmentTuple?.[0];

		// if next segment found, go to it
		if (slug) {
			await goto(slug);
			if (nextSegmentTuple[1] == 'forward') currentForm = 'Translate';
			else if (nextSegmentTuple[1] == 'review') currentForm = 'Review';
		} else {
			return;
		}
	}
</script>

{#snippet nodeButton(node: LocationNode, currentPath: string)}
	{@const hasGrandchildren =
		node.children.size > 0 && [...node.children.values()].some((n) => n.children.size > 0)}
	{@const hasChildren = node.children.size > 0}
	<button
		title="See {node.slug}"
		class="w-full cursor-pointer {button.stanley}  p-2 rounded-lg"
		onclick={() => {
			goto(currentPath + '/' + node.slug);
		}}
	>
		<div class="flex">
			<p class="w-full text-center">
				{#if !hasGrandchildren && !hasChildren}📋{/if}
				{makeFolderLabel(node.name)}
			</p>
		</div>

		<div class="w-full px-2">
			<CompletionChart completion={node.completion} options={{ showKey: true }} />
		</div>
	</button>
{/snippet}

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
	{@const newPageSegments: SegmentMap = (()=>{
		if (!currentNode) return {} as SegmentMap;
		const segments: SegmentMap = {};
		for (const id of currentNode.segmentIds) {
			const segmentData = segmentMap[id];
			if (segmentData) segments[id] = segmentData;
		}
		return segments;
	 })()}
	{@const pageSegments:  Record<string, SegmentMap> = (() => {
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
			{#key currentPath}
				<section
					in:fly|global={{ x: 10, duration: 200, delay: 100 }}
					out:fly|global={{ x: -10, duration: 100 }}
				>
					{#if formChildren && formChildren.length > 0}
						<div class="grid p-2 gap-2 sm:grid-cols-2">
							{#each formChildren as child}
								{@render nodeButton(child, currentPath)}
							{/each}
						</div>
					{/if}
					{#if sectionChildren && sectionChildren.length > 0}
						<div class="grid p-2 gap-2 sm:grid-cols-2">
							{#each sectionChildren as child}
								{@render nodeButton(child, currentPath)}
							{/each}
						</div>
					{/if}
					{#if nodeChildren && [...nodeChildren].length > 0}
						<div class="grid p-2 gap-2 sm:grid-cols-2">
							{#each nodeChildren as child}
								{@render nodeButton(child, currentPath)}
							{/each}
						</div>
					{/if}
				</section>
			{/key}
		{/if}
		<!-- Segments at this location -->
		<!-- Forms for interacting with segments -->
		{#if data.currentNode.segmentIds.length > 0}
			{#key currentPath}
				<section
					in:fly|global={{ x: 10, duration: 200, delay: 100 }}
					out:fly|global={{ x: -10, duration: 100 }}
				>
					<div class="text-lg flex justify-center">
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
					<div>
						{#if currentForm == 'Translate'}
							{#key currentPath}
								<ForwardTranslationsForm
									segmentMap={newPageSegments}
									{profile}
									{onsubmit}
								/>
							{/key}
						{:else if currentForm == 'Review'}
							<TranslationReviewForm segmentMap={pageSegments['review']} {profile} {onsubmit} />
						{:else if currentForm == 'Backward Translate'}
							<p class="w-full text-center text-xl mt-10">Backward Translation is Coming Soon!</p>
						{/if}
					</div>
				</section>
			{/key}
		{/if}
	{/if}
{:catch error}
	<!-- Error state -->
	<div class="p-8 font-medium text-red-800 dark:text-red-400">
		<h2>Error loading data</h2>
		<p>{error.message}</p>
	</div>
{/await}
