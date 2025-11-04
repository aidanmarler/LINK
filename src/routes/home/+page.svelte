<script lang="ts">
	import { button_A_active, button_A_inactive, card_dynamic, card_static } from '$lib/styles.js';
	import { presetOptions } from '$lib/supabase/presets';
	import type { LinkPreset, OriginalSegmentRow, SegmentMap } from '$lib/supabase/types.js';
	import { createSlug } from '$lib/utils/slug.js';
	import { capitalizeFirstLetter } from '$lib/utils/utils.js';
	import { fade, fly } from 'svelte/transition';
	import { supabase } from '../../supabaseClient';
	import { invalidate, invalidateAll } from '$app/navigation';

	let { data } = $props();
	let { profile } = data;

	let infoOpen = $state(false);
	let presetsOpen = $state(!profile.selected_preset);

	let routes = ['arc', 'lists'];

	async function handlePresetChange(preset: null | string) {
		console.log('handlePresetChange');
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
	<div in:fade={{ duration: 500, delay: 100 }} out:fade={{ duration: 100 }}>
		<div class="mx-auto w-full justify-center flex mt-8 opacity-70">
			<img alt="LINK icon" class="dark:invert-0 invert w-12" src="/link.svg" />
			<h1 class="font-bold text-6xl">LINK</h1>
		</div>
	</div>

	<div in:fly={{ y: 20, duration: 500, delay: 100 }} out:fly={{ y: 10, duration: 100 }}>
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
						Welcome, <em in:fade={{ duration: 1000 }}>{profile.name}</em>
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
					<p class="text-base text-center">If you do not know, <span class="font-bold"> skip</span></p>
					<p class="text-base text-center">If you have something to say, <span class="font-bold">leave a comment</span></p>

					<p class="text-center text-xl font-medium py-6">Thank you, good luck, and happy translating!</p>
				</div>
			</div>
			<div class=" rounded-lg {card_static}">
				<div class=" border-inherit w-full text-stone-800 dark:text-stone-300">
					<div class=" flex justify-between items-end p-2 px-4 border-inherit">
						<button
							onclick={() => {
								presetsOpen = !presetsOpen;
							}}
							data-sveltekit-preload-code="eager"
							class="text-xl cursor-pointer flex hover:underline font-semibold"
						>
							CRF to Translate
						</button>
						<p>
							{Object.keys(presetOptions).find(
								(key) => presetOptions[key] === profile.selected_preset
							) ?? 'None'}
						</p>
					</div>
					{#if presetsOpen}
						<div class=" border-inherit">
							<p class="mb-2 text-lg font-normal italic text-center">
								Which CRF would you like to review?
							</p>
							<div
								class=" p-1 grid grid-cols-1 sm:grid-cols-2 rounded-md border-inherit gap-0.5 font-normal"
							>
								{#each Object.keys(presetOptions) as presetOption}
									{@const selected = presetOptions[presetOption] == profile.selected_preset}
									<button
										class="px-3 text-left {selected ? button_A_inactive : button_A_active}"
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
		</div>

		{#each routes as route}
			<div class="w-full mt-5">
				<div class="w-full rounded-lg {card_static}">
					<div class="flex justify-between items-end p-2 px-4 mb-3 border-b border-inherit">
						<a
							data-sveltekit-preload-code="eager"
							class="text-3xl hover:underline font-semibold"
							href="/home/{route}"
						>
							{route}
						</a>
					</div>
					<div class="p-3 text-lg">
						{#await data.dataPromise}
							<div class="loading">
								<p>Loading...</p>
							</div>
							<!-- {:then loadedData} -->
						{:catch error}
							<div class="error">
								<p>Failed to load data: {error.message}</p>
								<button onclick={() => window.location.reload()}>Retry</button>
							</div>
						{/await}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
