<script lang="ts">
	import { button } from '$lib/styles.js';
	import { fade, fly, scale } from 'svelte/transition';
	import { findNextSegment, getSegmentSlug } from '$lib/utils/nextSegment';
	import DocumentSelect from './documentSelect.svelte';
	import Welcome from './welcome.svelte';

	let { data } = $props();
	let profile = $derived(data.profile);
	let presetName = $derived(profile.selected_preset?.split('_')[1] ?? profile.selected_preset);
	const start_style =
		'flex max-w-80 justify-center w-full pt-5 pb-3 flex-col text-5xl font-semibold rounded-3xl text-center bg-linear-15 from-green-800/80 to-green-400/50 shadow-lg shadow-stone-500/50 ';
	const start_interaction =
		' cursor-pointer hover:from-green-800/80 duration-50 hover:to-green-400/90 hover:shadow-stone-500/90 active:opacity-70 hover:text-black transition-all hover:opacity-100 opacity-90 ';
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
				<div class=" flex w-full justify-center  flex-col">
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

				<div class="w-full mt-2 mb-3 flex justify-center">
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
						class="w-full border-2 items-center px-3 flex bg-stone-500/50 text-xl justify-between font-semibold max-w-80 py-1 rounded-lg {button.stone} {button.stoneHover}"
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
			<div class="max-w-2xl mt-20 mx-auto" transition:fade>
				<h3 class="font-semibold  text-2xl">Translated Segments</h3>
				<div
					class="border-0 shadow-inner shadow-stone-500/30 z-10 rounded-lg max-h-30 overflow-auto"
				>
					{#each Object.entries(loadedData.segmentMap).filter(([_id, v]) => v.forwardTranslation != null) as [id, v]}
						{@const slug = getSegmentSlug(+id, loadedData.locationTree, '/home')}
						<a
							class="px-2 flex text-sky-800 z-0 hover:underline border-b border-stone-400 hover:bg-stone-100 active:bg-stone-300"
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

				<h3 class="font-semibold text-2xl mt-10">Reviewed Segments</h3>
				<div
					class="border-0 shadow-inner shadow-stone-500/30 z-10 rounded-lg max-h-30 overflow-auto"
				>
					{#each Object.entries(loadedData.segmentMap).filter(([_id, v]) => v.translationReview != null) as [id, v]}
						{@const slug = getSegmentSlug(+id, loadedData.locationTree, '/home')}
						<a
							class="px-2 flex text-sky-800 z-0 hover:underline border-b border-stone-400 hover:bg-stone-100 active:bg-stone-300"
							href={slug}
						>
							<span>{v.originalSegment.segment}</span>
						</a>
					{/each}
				</div>
			</div>
		{/await}
		<!--
		<fieldset
			class=" bg-stone-200 border {presetsOpen
				? 'shadow-md border-stone-700'
				: 'border-stone-400'} w-full rounded-lg mb-15"
		>
			<legend class="ml-3 px-1 text-lg flex"
				><button
					onclick={() => (presetsOpen = !presetsOpen)}
					class="font-bold flex hover:shadow-xs hover:underline object-center text-2xl px-1 pr-3 hover:bg-stone-100 rounded-lg cursor-pointer"
					><svg
						class="{presetsOpen
							? 'rotate-90'
							: ''} stroke-stone-900 dark:stroke-stone-200 duration-200 transition-transform h-8 w-8 p-1"
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
					Form to Translate
				</button>
				<p
					class="h-full align-bottom origin-bottom object-bottom mt-0.5 px-2 font-serif italic bg-stone-300 rounded-xl mx-1"
				>
					{presetName}
				</p>
			</legend>

			
			<div
				class="transition-all overflow-auto duration-400
							{presetsOpen ? 'max-h-220 ' : 'max-h-0 '} "
			>
				{#if presetsOpen}
					<div class={style.border}>
						{#await data.dataPromise}
							<p>loading...</p>
						{:then loadedData}
							<DocumentSelect {profile} documents={loadedData.documents} />
						{/await}
					</div>
				{/if}
			</div>
		
		</fieldset>	-->

		<!--
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
		-->
	</div>
{/if}
