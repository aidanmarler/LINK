<script lang="ts">
	import { button, style } from '$lib/styles.js';
	import { presetOptions } from '$lib/supabase/presets';
	import { capitalizeFirstLetter } from '$lib/utils/utils.js';
	import { fade, fly } from 'svelte/transition';
	import { supabase } from '../../supabaseClient';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import CompletionChart from './[...location]/completionChart.svelte';
	import { findNextSegment } from '$lib/utils/nextSegment';

	let { data } = $props();
	let { profile } = data;

	let presetsOpen = $state(!profile.selected_preset);

	let routes = ['arc', 'lists'];

	async function handlePresetChange(preset: null | string) {
		//console.log('handlePresetChange');
		const { error } = await supabase
			.from('profiles')
			.update({ selected_preset: preset })
			.eq('id', profile.id);

		if (error) console.error(error);
		//else console.log(await supabase.from('profiles').update({ selected_preset: preset }));
		//else window.location.href = url.toString();

		// Reload the page
		window.location.href = 'home'; // Full page reload

		//invalidateAll(); // This re-runs all load functions
	}
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
					<p>CRF to Translate</p>

					<p>
						{Object.keys(presetOptions).find(
							(key) => presetOptions[key] === profile.selected_preset
						) ?? 'None'}
					</p>
				</button>

				{#if presetsOpen}
					<div class=" rounded-b-lg {style.border} border-x border-b">
						<p class="mb-2 text-lg font-normal italic text-center">
							Which CRF would you like to review?
						</p>
						<div
							class=" p-1 grid grid-cols-1 sm:grid-cols-2 rounded-md border-inherit gap-0.5 font-normal"
						>
							{#each Object.keys(presetOptions) as presetOption}
								{@const selected = presetOptions[presetOption] == profile.selected_preset}
								{@const title = selected ? '' : 'Review ' + presetOption}
								<button
									{title}
									class="px-3 text-left {selected ? button.simple.inactive : button.simple.active}"
									onclick={() => handlePresetChange(presetOptions[presetOption])}
								>
									{presetOption}
								</button>
							{/each}
						</div>
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
				{@const nextSegment = findNextSegment(
					loadedData.locationTree,
					loadedData.segmentMap,
					'/home'
				)}

				{#if nextSegment}
					<button
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
			{/await}
		</div>
	</div>
{/if}
