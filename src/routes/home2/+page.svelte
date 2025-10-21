<script lang="ts">
	import { card_static } from '$lib/styles.js';
	import type { OriginalSegmentRow, SegmentMap } from '$lib/supabase/types.js';
	import { createSlug } from '$lib/utils/slug.js';
	import { capitalizeFirstLetter } from '$lib/utils/utils.js';
	import { fade, fly } from 'svelte/transition';

	let { data } = $props();
	let { profile } = data;

	let infoOpen = $state(false);

	let originalSegments: SegmentMap = $derived(data.segmentMap);

	let routes = ['arc', 'lists'];
</script>

{#if originalSegments}
	<div in:fade={{ duration: 500, delay: 100 }} out:fade={{ duration: 100 }}>
		<div class="mx-auto w-full justify-center flex mt-8 mb-4 opacity-70">
			<img alt="LINK icon" class="dark:invert-0 invert w-10" src="/link.svg" />
			<h1 class="font-bold text-5xl">LINK</h1>
		</div>
		<h2 class="text-center">
			Welcome, <em in:fade={{ duration: 1000 }}>{profile.name}</em>
		</h2>
	</div>

	<div in:fly={{ y: 20, duration: 500, delay: 100 }} out:fly={{ y: 10, duration: 100 }}>
		<div class="w-full mt-5">
			<div class="w-full text-stone-800 dark:text-stone-300 rounded-lg border-0 {card_static}">
				<div class="flex justify-between border-b items-end p-2 px-4 border-inherit">
					<button
						onclick={() => {
							infoOpen = !infoOpen;
						}}
						data-sveltekit-preload-code="eager"
						class="text-xl cursor-pointer hover:underline font-semibold"
					>
						Info
					</button>
				</div>
				{#if infoOpen}
					<div class="p-3 font-normal">
						<h3 class="text-xl mb-2">
							This is <span class="font-bold">LINK</span>, the
							<span class="italic">Language Integration Network Kit</span>.
						</h3>
						<p class="mb-4">
							Thank you for helping us translate ARC from English into {capitalizeFirstLetter(
								profile.language ? profile.language : ''
							)}.
						</p>

						<p>Translation requires three steps:</p>
						<ol>
							<li>
								1. <span class="font-bold"> Forward Translation:</span> translating phrases from English.
							</li>
							<li>
								2. <span class="font-bold"> Review:</span> choosing the best translation offered so far,
								or creating a new better one.
							</li>
							<li>
								3. <span class="font-bold"> Backward Translation:</span> translating reviewed translations
								back into English.
							</li>
						</ol>
					</div>
				{/if}
			</div>
		</div>
		{#each routes as route}
			<div class="w-full mt-5">
				<div class="w-full rounded-lg {card_static}">
					<div class="flex justify-between items-end p-2 px-4 mb-3 border-b border-inherit">
						<a
							data-sveltekit-preload-code="eager"
							class="text-3xl hover:underline font-semibold"
							href="/home2/{route}"
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
