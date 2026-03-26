<script lang="ts">
	import { button, style } from '$lib/styles.js';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import CompletionChart from './[...location]/completionChart.svelte';
	import { findNextSegment } from '$lib/utils/nextSegment';
	import DocumentSelect from './documentSelect.svelte';
	import Welcome from './welcome.svelte';

	let { data } = $props();
	let profile = $derived(data.profile);
	let presetsOpen = $derived(!profile.selected_preset);

	let routes = ['arc', 'lists'];
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
	>
		<div class="w-full">

			<Welcome {profile}/>
			<div class=" border-inherit w-full text-stone-800 dark:text-stone-300">
				<button
					onclick={() => {
						presetsOpen = !presetsOpen;
					}}
					title="{presetsOpen ? 'Close' : 'Open'} Preset Options"
					data-sveltekit-preload-code="eager"
					class=" w-full {button.stanley} {presetsOpen
						? 'rounded-t-lg'
						: 'rounded-lg'} flex justify-between items-end p-2 px-4 border-inherit text-xl cursor-pointer hover:underline font-semibold"
				>
					<div class=" items-center flex">
						<svg
							class="{presetsOpen
								? 'rotate-90'
								: ''} stroke-stone-900 dark:stroke-stone-200 duration-100 transition-transform mr-2 h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								fill="none"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="m9 5l6 7l-6 7"
							/>
						</svg>
						CRF to Translate
					</div>

					<p>
						{profile.selected_preset}
					</p>
				</button>

				<!-- presets -->
				{#if presetsOpen}
					<div class=" rounded-b-lg {style.border} border-x border-b">
						{#await data.dataPromise}
							<p>loading...</p>
						{:then loadedData}
							<DocumentSelect {profile} documentMap={loadedData.documentMap} />
						{/await}
					</div>
				{/if}
			</div>
		</div>

		{#each routes as route}
			<div class="w-full mt-5">
				<div class="w-full">
					<button
						onclick={() => {
							goto('/home/' + route);
						}}
						title="See {route == 'arc' ? 'ARC Questions' : 'Listed Options'}"
						data-sveltekit-preload-code="eager"
						class=" text-stone-800 dark:text-stone-300 w-full {button.stanley}
							rounded-t-lg flex justify-between items-end p-2 px-4 border-inherit text-xl cursor-pointer hover:underline font-semibold"
					>
						<p data-sveltekit-preload-code="eager" class="text-3xl font-semibold">
							{route == 'arc' ? 'ARC Questions' : 'Listed Options'}
						</p>
					</button>
					<div class="p-3 rounded-b-lg border-x border-b border-inherit text-lg {style.border}">
						{#await data.dataPromise}
							<div class="loading">
								<p>Loading...</p>
							</div>
						{:then loadedData}
							{@const locationNode = loadedData.locationTree.children.get(route)}
							{#if locationNode != undefined}
								<CompletionChart
									completion={locationNode.completion}
									options={{ showKey: true, large: true }}
								/>
							{/if}
						{:catch error}
							<div class="error">
								<p>Failed to load data: {error.message}</p>
								<button onclick={() => window.location.reload()}>Retry</button>
							</div>
						{/await}

						{#if route == 'arc'}
							<a
								class={style.href}
								target="_blank"
								href="https://github.com/ISARICResearch/ARC/blob/main/README.md">ARC</a
							> is a repository of medical questionnaire Questions, Answers, Definitions, and Completion
							Guides.
						{:else if route == 'lists'}
							Listed options are options that can be selected when filling out one of these medical
							questionnaires.
						{/if}
					</div>
				</div>
			</div>
		{/each}

		<div class="w-full flex justify-center">
			{#await data.dataPromise}
				<button
					class="{button.green} border-[3px] text-lg right-0 font-semibold opacity-40 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
				>
					Go to Next Segment
				</button>
			{:then loadedData}
				{@const nextSegmentTuple = findNextSegment(
					loadedData.locationTree,
					loadedData.segmentMap,
					'/home',
					'forward'
				)}
				{@const slug = nextSegmentTuple?.[0]}
				{#if slug}
					<button
						title={'Next segment ' + slug}
						onclick={() => {
							goto(slug, { state: { form: nextSegmentTuple[1] } });
						}}
						class="{button.green.default} {button.green
							.hover} border-[3px] text-lg right-0 font-semibold opacity-90 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
					>
						Go to Next Segment: {slug.split('/').at(-1)}
					</button>
				{:else}
					<div
						class=" border-[3px] text-lg right-0 font-semibold opacity-40 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
					>
						No more segments to translate!
					</div>
				{/if}
			{/await}
		</div>
	</div>
{/if}
