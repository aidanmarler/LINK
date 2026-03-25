<script lang="ts">
	import { button, style } from '$lib/styles.js';
	import { capitalizeFirstLetter } from '$lib/utils/utils.js';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import CompletionChart from './[...location]/completionChart.svelte';
	import { findNextSegment } from '$lib/utils/nextSegment';
	import DocumentSelect from './[...location]/documentSelect.svelte';
	import { getContext } from 'svelte';
	import { getLinkContext } from './loadLink';

	let { data } = $props();
	let profile = $derived(data.profile);
	let presetsOpen = $derived(!profile.selected_preset);

	let routes = ['arc', 'lists'];
	const refreshLinkData = getContext<() => void>('refreshLinkData');

	const linkContext = getLinkContext();
</script>

<button onclick={refreshLinkData}>Refresh</button>

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
			<div class="w-full text-stone-800 dark:text-stone-300">
				<div class="max-w-3xl p-2 m-auto text-lg font-normal">
					<h3 class="italic text-3xl p-0 font-medium w-full mb-10 text-center">
						<span class=""
							><span class="font-bold">L</span>anguage
							<span class="font-bold">I</span>ntegration
							<span class="font-bold">N</span>etwork
							<span class="font-bold">K</span>it</span
						>
					</h3>
					<p class="text-center">
						Welcome, <em in:fade={{ duration: 1000, delay: 100 }}>{profile.name}</em>
					</p>
					<p class="mb-8 w-full italic text-center text-base">
						Thank you ❤️ for helping to translate ARC from English into {capitalizeFirstLetter(
							profile.language ? profile.language : ''
						)}.
					</p>

					<p>High-quality translations require three steps:</p>
					<ol class="p-3">
						<li>
							1. <span class="font-bold"> Forward Translation:</span> translate phrases from English
							into {capitalizeFirstLetter(profile.language ? profile.language : '')}.
						</li>
						<li>
							2. <span class="font-bold"> Review:</span> select the correct translation, or write a new
							one with a justification.
						</li>
						<li>
							3. <span class="font-bold"> Backward Translation:</span> translating reviewed translations
							back into English.
						</li>
					</ol>
					<p class="text-base text-center py-6">
						All translations will be reviewed, and the ones that are agreed by your peers to be best
						will be added to the ARC database to be used around the world!
					</p>
					<p class="text-base text-center">
						If you do not know, <span class="font-bold"> skip</span>
					</p>
					<p class="text-base text-center">
						If you have something to say, <span class="font-bold">leave a comment</span>
					</p>

					<p class="text-center text-xl font-medium py-6">
						Thank you, good luck, and happy translating!
					</p>
				</div>
			</div>

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
						{#if linkContext.data}
							<DocumentSelect {profile} documentMap={linkContext.data.documentMap} />
						{:else}<p>loading...</p>{/if}
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
						{#if linkContext.data}
							{@const locationNode = linkContext.data.locationTree.children.get(route)}
							{#if locationNode != undefined}
								<CompletionChart
									completion={locationNode.completion}
									options={{ showKey: true, large: true }}
								/>
							{/if}
						{/if}
						<!--
						{#await getLinkData()}
							<div class="loading">
								<p>Loading...</p>
							</div>
						{:then linkData}
							{@const locationNode = linkData.locationTree.children.get(route)}
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
						{/await}-->

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
			{#if linkContext.data}
				{@const nextSegment = findNextSegment(
					linkContext.data.locationTree,
					linkContext.data.segmentMap,
					'/home'
				)}

				{#if nextSegment}
					<button
						title={'Next segment ' + nextSegment}
						onclick={() => {
							goto(nextSegment);
						}}
						class="{button.green.default} {button.green
							.hover} border-[3px] text-lg right-0 font-semibold opacity-90 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
					>
						Go to Next Segment: {nextSegment.split('/').at(-1)}
					</button>
				{:else}
					<div
						class=" border-[3px] text-lg right-0 font-semibold opacity-40 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
					>
						No more segments to translate!
					</div>
				{/if}
			{/if}
			<!--
			{#await getLinkData()}
				<button
					class="{button.green} border-[3px] text-lg right-0 font-semibold opacity-40 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
				>
					Go to Next Segment
				</button>
			{:then linkData}
				{@const nextSegment = findNextSegment(linkData.locationTree, linkData.segmentMap, '/home')}

				{#if nextSegment}
					<button
						title={'Next segment ' + nextSegment}
						onclick={() => {
							goto(nextSegment);
						}}
						class="{button.green.default} {button.green
							.hover} border-[3px] text-lg right-0 font-semibold opacity-90 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
					>
						Go to Next Segment: {nextSegment.split('/').at(-1)}
					</button>
				{:else}
					<div
						class=" border-[3px] text-lg right-0 font-semibold opacity-40 hover:opacity-100 hover:shadow-sm px-4 cursor-pointer rounded-xl mt-5"
					>
						No more segments to translate!
					</div>
				{/if}
			{/await}-->
		</div>
	</div>
{/if}
