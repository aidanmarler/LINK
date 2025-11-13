<script lang="ts">
	import { goto } from '$app/navigation';
	import { button_A_active, button_B, button_green, card_dynamic } from '$lib/styles';
	import type { SegmentMap } from '$lib/supabase/types.js';
	import type { Profile, UserForm } from '$lib/types.js';
	import CompletionChart from './completionChart.svelte';
	import ForwardTranslationsForm from './components/forwardTranslationsForm.svelte';

	let { data } = $props();

	let currentForm: UserForm = $state('Forward Translate');
	let forms: UserForm[] = ['Forward Translate', 'Review', 'Backward Translate'];

	//class="grid p-2 gap-1 gap-x-2 grid-cols-2"
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
				<div class="grid p-2 gap-2 sm:grid-cols-2">
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
							class="w-full shadow-sm cursor-pointer {button_A_active}  p-2 rounded-lg"
							onclick={() => {
								goto(currentPath + '/' + child.slug);
							}}
						>
							<p class="w-full text-center">{child.name}</p>
							<div class="w-full px-2">
								<CompletionChart completion={child.completion} options={{ showKey: true }}
								></CompletionChart>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Segments at this location -->
		{#if data.currentNode.segmentIds.length > 0}
			<section>
				<div class="text-lg flex justify-center">
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
				{#if currentForm == 'Forward Translate'}
					<ForwardTranslationsForm segmentMap={pageSegments} {profile} />
				{/if}
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
