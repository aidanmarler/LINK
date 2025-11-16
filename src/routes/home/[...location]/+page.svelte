<script lang="ts">
	import { goto } from '$app/navigation';
	import { button } from '$lib/styles';
	import type { SegmentMap } from '$lib/supabase/types.js';
	import type { Profile, UserForm } from '$lib/types.js';
	import { findNextSegment2 } from '$lib/utils/nextSegment';
	import { fade, fly } from 'svelte/transition';
	import CompletionChart from './completionChart.svelte';
	import ForwardTranslationsForm from './components/forwardTranslationsForm.svelte';
	import { makeFolderLabel } from '$lib/utils/utils';

	let { data } = $props();

	let currentForm: UserForm = $state('Forward Translate');
	let forms: UserForm[] = ['Forward Translate', 'Review', 'Backward Translate'];

	async function onsubmit(shouldContinue: boolean) {
		if (!shouldContinue) return;

		const resolvedData = await data.dataPromise;

		const nextSegment = findNextSegment2(
			resolvedData.locationTree,
			resolvedData.segmentMap,
			'/home'
		);

		if (nextSegment) {
			await goto(nextSegment, { invalidateAll: true });
		}
	}
</script>

{#await data.dataPromise}
	<div>Loading...</div>
{:then resolvedData}
	{@const currentNode = data.currentNode}
	{@const segmentMap = resolvedData.segmentMap}
	{@const currentPath =
		data.pathSegments.length > 0 ? `/home/${data.pathSegments.join('/')}` : '/home'}
	{@const profile = data.profile as Profile}

	{@const pageSegments = (() => {
		console.log('loading pageSegments...');
		if (!currentNode) return {} as SegmentMap;
		const filtered: SegmentMap = {};
		for (const id of currentNode.segmentIds) {
			if (segmentMap[id]) {
				filtered[id] = segmentMap[id];
			}
		}
		return filtered;
	})()}

	{#if data.notFound}
		<div>
			<h1>Location Not Found</h1>
			<a href="/home">Return to Home</a>
		</div>
	{:else if currentNode}
		<!-- Child locations -->
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
		{#if data.currentNode.segmentIds.length > 0}
			<section>
				<div
					in:fade|global={{ duration: 200, delay: 100 }}
					out:fade|global={{ duration: 100 }}
					class="text-lg flex justify-center"
				>
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
							<span class="mr-2">{form}</span>
						</label>
					{/each}
				</div>
				<div
					in:fly|global={{ x: 10, duration: 200, delay: 100 }}
					out:fly|global={{ x: -10, duration: 100 }}
				>
					{#if currentForm == 'Forward Translate'}
						<!-- Can we call a re-load of forward transltions form?-->
						{#key currentPath}
							<ForwardTranslationsForm segmentMap={pageSegments} {profile} {onsubmit} />
						{/key}
					{:else if currentForm == 'Review'}
						<p class="w-full text-center text-xl mt-10">Nothing to review!</p>
					{:else if currentForm == 'Backward Translate'}
						<p class="w-full text-center text-xl mt-10">Nothing to backward translate!</p>
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
