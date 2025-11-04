<script lang="ts">
	import type { SegmentMap } from '$lib/supabase/types.js';
	import type { Profile, UserForm } from '$lib/types.js';
	import ForwardTranslationsForm from './components/forwardTranslationsForm.svelte';

	let { data } = $props();

	let currentForm: UserForm = $state('Forward Translate');
	let forms: UserForm[] = ['Forward Translate', 'Review', 'Backward Translate'];

	$inspect(data.currentNode?.children)
</script>

<!-- Breadcrumbs 
	<nav class="breadcrumbs">
		<a href="/home2">Home</a>
		{#each data.breadcrumbs as crumb}
			<span> / </span>
			<a href={crumb.path}>{crumb.name}</a>
		{/each}
	</nav>

	<h1>{data.currentNode?.name || 'Home2'}</h1>-->

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
				<!--<h2>Sections</h2>-->
				<ul>
					{#each [...currentNode.children.values()] as child}
						<li>
							<a class="hover:underline cursor-pointer" href="{currentPath}/{child.slug}"
								>{child.name}</a
							>
						</li>
					{/each}
				</ul>
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
	<div class="p-8 text-red-600">
		<h2>Error loading data</h2>
		<p>{error.message}</p>
	</div>
{/await}
