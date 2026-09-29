<script lang="ts">
	import { goto } from '$app/navigation';
	import type { SegmentMap } from '$lib/supabase/types.js';
	import type { Profile } from '$lib/types.js';
	import { getSegmentSlug, initializeTraversal } from '$lib/utils/nextSegment';
	import { fly } from 'svelte/transition';

	import CompositeForm from './components/compositeForm.svelte';
	import NodeButton from './components/NodeButton.svelte';

	let { data } = $props();

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
	async function onsubmit(shouldContinue: boolean, forward: boolean) {
		if (!shouldContinue) return; // ignore if only a "save"

		const resolvedData = await data.dataPromise; // get current data

		const segs = initializeTraversal(resolvedData.locationTree, data.pathSegments, forward);
		if (segs) {
			const nextSegment = segs.reverse()[0];
			if (nextSegment) {
				const nextSlug = getSegmentSlug(
					nextSegment?.segmentIds[0],
					resolvedData.locationTree,
					'/home'
				);
				if (nextSlug) await goto(nextSlug);
			}
		}
	}
</script>

{#await data.dataPromise}
	<div>Loading...</div>
{:then resolvedData}
	<!----- Get Page/Path Data ----->
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

	{#if data.notFound}
		<div>
			<h1>Location Not Found</h1>
			<a href="/home">Return to Home</a>
		</div>
	{:else if currentNode}
		<!----- Navigation Buttons ------>
		<!-- Here is where we show all next locations, if not at an end path -->

		{#if currentNode.children.size > 0}
			{#key currentPath}
				<section
					in:fly|global={{ x: 10, duration: 200, delay: 100 }}
					out:fly|global={{ x: -10, duration: 100 }}
				>
					{#if formChildren && formChildren.length > 0}
						<div class="grid p-2 gap-2 sm:grid-cols-2">
							{#each formChildren as node}
								<NodeButton {node} {currentPath} />
							{/each}
						</div>
					{/if}
					{#if sectionChildren && sectionChildren.length > 0}
						<div class="grid p-2 gap-2 sm:grid-cols-2">
							{#each sectionChildren as node}
								<NodeButton {node} {currentPath} />
							{/each}
						</div>
					{/if}
					{#if nodeChildren && [...nodeChildren].length > 0}
						<div class="grid p-2 gap-2 sm:grid-cols-2">
							{#each nodeChildren as node}
								<NodeButton {node} {currentPath} />
							{/each}
						</div>
					{/if}
				</section>
			{/key}
		{/if}

		<!----- Translation Form ------>
		<!-- Here we show the Composite form for intereacting with the segements at this level -->

		{#if data.currentNode.segmentIds.length > 0}
			{#key currentPath}
				<section
					in:fly|global={{ x: 10, duration: 200, delay: 100 }}
					out:fly|global={{ x: -10, duration: 100 }}
				>
					<CompositeForm
						segmentMap={newPageSegments}
						{profile}
						{onsubmit}
						relatedReviewsProm={data.relatedReviews}
						relatedTranslationsProm={data.relatedTranslations}
					/>
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
