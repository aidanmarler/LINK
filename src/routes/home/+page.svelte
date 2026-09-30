<script lang="ts">
	import { button, shadow } from '$lib/styles.js';
	import { fade, fly } from 'svelte/transition';
	import { findNextSegment, getSegmentSlug } from '$lib/utils/nextSegment';
	import DocumentSelect from './documentSelect.svelte';
	import Welcome from './welcome.svelte';
	import { generateDocumentName } from '$lib/utils/utils';
	import NodeButton from './[...location]/components/NodeButton.svelte';

	let { data } = $props();
	let profile = $derived(data.profile);
	let presetName = $derived(generateDocumentName(profile.selected_preset ?? ''));
	const start_style =
		'flex max-w-80 justify-center w-full pt-5 pb-3 flex-col text-5xl font-semibold rounded-xl  text-center bg-linear-15 from-green-800/80 to-green-400/50 shadow-lg  ' +
		shadow.color;
	const start_interaction =
		' cursor-pointer hover:from-green-800/80 duration-50 hover:to-green-400/90 hover:shadow-stone-500/90 dark:hover:shadow-black/90 active:opacity-70 hover:text-black dark:hover:text-white transition-all hover:opacity-100 opacity-90 ';
</script>

{#if profile}
	<div in:fade|global={{ duration: 500, delay: 100 }} out:fade|global={{ duration: 100 }}>
		<div class="mx-auto w-full justify-center flex mt-8 opacity-70">
			<img alt="LINK icon" class="dark:invert-0 invert w-12" src="/link.svg" />
			<h1 class="font-bold text-6xl">LINK</h1>
		</div>
	</div>

	<div
		in:fly|global={{ y: 20, duration: 500, delay: 100 }}
		out:fly|global={{ y: 10, duration: 100 }}
		class="w-full justify-center items-center"
	>
		<Welcome {profile} />

		<!--buttons div-->
		<div class=" w-full flex my-5 items-center flex-col justify-center">
			<div class="bg-amber-200/0 max-w-3xl w-full justify-center">
				<div class=" flex w-full justify-center flex-col">
					{#await data.dataPromise}
						<div class="{start_style} mx-auto opacity-60 cursor-wait">
							<span class="w-full">START</span>
							<span class="text-lg font-medium italic pt-1"> {presetName} </span>
						</div>
					{:then loadedData}
						{@const nextSegmentTuple = findNextSegment(
							loadedData.locationTree,
							loadedData.segmentMap,
							'/home',
							'forward'
						)}
						{@const slug = nextSegmentTuple?.[0]}
						{#if slug}
							<a
								title={'Next segment ' + slug}
								href={slug}
								class="  mx-auto {start_interaction} {start_style}"
							>
								<span class="w-full">START</span>
								<span class="text-lg font-medium italic pt-1"> {presetName} </span>
							</a>
						{:else}
							<div class="  opacity-40 {start_style}">No more segments to translate!</div>
						{/if}
					{/await}
				</div>

				<div class="w-full mt-4 mb-10 flex justify-center">
					{#await data.dataPromise}
						<p class="cursor-wait opacity-60">
							<span class="text-stone-800">Document:</span>
							<span class="font-semibold">{presetName} ▾</span>
						</p>
					{:then loadedData}
						<DocumentSelect {profile} documents={loadedData.documents} />
					{/await}
				</div>

				<div class="w-full flex justify-center">
					<a
						title="Go to Tutorial"
						href="/home/tutorial"
						class="w-full border-2 items-center px-3 flex text-xl justify-between font-semibold max-w-80 py-1 rounded-lg {button.stone} {button.stoneHover}"
					>
						<span>How it works</span>
						<span>→</span>
					</a>
				</div>
			</div>
		</div>

		{#await data.dataPromise}
			<div class="loading"></div>
		{:then loadedData}
			{@const started =
				loadedData.locationTree.completion.forwardComplete +
					loadedData.locationTree.completion.reviewComplete >
				0}
			{#if started}
				<div
					class="max-w-2xl bg-stone-300/50 dark:bg-stone-900/50 rounded-xl p-4 px-8 shadow {shadow.color} mt-20 mx-auto"
					transition:fly={{ y: 15 }}
				>
					<h3 class="font-medium text-lg">Translated Segments</h3>
					<div
						class="border-0 shadow-inner mb-5 z-10 rounded-lg max-h-30 overflow-auto {shadow.soft}"
					>
						{#each Object.entries(loadedData.segmentMap).filter(([_id, v]) => v.forwardTranslation != null) as [id, v]}
							{@const slug = getSegmentSlug(+id, loadedData.locationTree, '/home')}
							<a
								class="px-2 flex text-sky-800 dark:text-sky-500 z-0 hover:underline border-b border-stone-400 hover:bg-stone-100 active:bg-stone-300"
								href={slug}
							>
								<!--
							<span>
								{#if v.originalSegment.location}
									{v.originalSegment.location.reverse()[1]}
								{/if}
							</span>-->
								<span>{v.originalSegment.segment}</span>
							</a>
						{/each}
					</div>

					<h3 class="font-medium text-lg">Reviewed Segments</h3>
					<div
						class="border-0 mb-5 shadow-inner z-10 rounded-lg max-h-30 overflow-auto {shadow.soft}"
					>
						{#each Object.entries(loadedData.segmentMap).filter(([_id, v]) => v.translationReview != null) as [id, v]}
							{@const slug = getSegmentSlug(+id, loadedData.locationTree, '/home')}
							<a
								class="px-2 flex text-sky-800 dark:text-sky-500 z-0 hover:underline border-b border-stone-400 hover:bg-stone-100 active:bg-stone-300"
								href={slug}
							>
								<span>{v.originalSegment.segment}</span>
							</a>
						{/each}
					</div>

					<h3 class="font-medium text-lg">Explore</h3>
					<div class="grid gap-2 sm:grid-cols-2">
						{#each loadedData.locationTree.children as [_label, node]}
							<NodeButton {node} currentPath={'/home'} />
						{/each}
					</div>
				</div>
			{/if}
		{/await}
	</div>
{/if}
