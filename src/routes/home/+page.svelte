<script lang="ts">
	import { onMount } from 'svelte';
	import type { AvailableLanguage, Category, TranslationLanguage } from '$lib/types';
	import {
		global_address,
		global_lists,
		global_lists_report,
		loadedStatus,
		reset_address,
		userProfile
	} from '$lib/global.svelte';
	import { fade, fly } from 'svelte/transition';
	import { card_static } from '$lib/styles';
	import DataView from '../components/dataView.svelte';
	import DataViewPlaceholder from '../components/dataView_placeholder.svelte';
	import { capitalizeFirstLetter } from '$lib/utils/utils';
	import { derived } from 'svelte/store';

	let infoOpen = $state(false);

	let language: AvailableLanguage = $derived(
		userProfile.user ? userProfile.user.language : 'spanish'
	);

	onMount(() => {
		reset_address();
		console.log(global_address);
	});
</script>

{#snippet CategorySummary(category: Category)}
	<div class="w-full mt-5">
		<div class="w-full rounded-lg {card_static}">
			<div class="flex justify-between items-end p-2 px-4 mb-3 border-b border-inherit">
				<a
					data-sveltekit-preload-code="eager"
					class="text-3xl hover:underline font-semibold"
					href="/home/{category.toLowerCase()}"
				>
					{category}
				</a>

				<p class="italic">
					{#if category == 'Lists'}
						{global_lists_report.summaryReport.needsReview} items to check, {(
							(global_lists_report.summaryReport.complete /
								(global_lists_report.summaryReport.complete +
									global_lists_report.summaryReport.incomplete +
									global_lists_report.summaryReport.needsReview)) *
							100
						).toFixed(1)}% complete
					{/if}
				</p>
			</div>
			<div class="p-3 text-lg">
				{#if category == 'Lists'}
					{#if loadedStatus.lists == true}
						<DataView
							completionReport={global_lists_report.summaryReport}
							options={{ showKey: true, large: true }}
						/>
					{:else}
						<DataViewPlaceholder options={{ showKey: true, large: true }} />
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<div in:fade={{ duration: 500, delay: 100 }} out:fade={{ duration: 100 }}>
	<div class="mx-auto w-full justify-center flex mt-8 mb-4 opacity-70">
		<img alt="LINK icon" class="dark:invert-0 invert w-10" src="/link.svg" />
		<h1 class="font-bold text-5xl">LINK</h1>
	</div>
	<h2 class="text-center">
		Welcome, <em in:fade={{ duration: 1000 }}>{userProfile.user?.name}</em>
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
							language
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
	<div class="w-full mt-5">
		<div class="w-full rounded-lg {card_static}">
			<div class="flex justify-between items-end p-2 px-4 mb-3 border-b border-inherit">
				<a
					data-sveltekit-preload-code="eager"
					class="text-3xl hover:underline font-semibold"
					href="/home/arc"
				>
					ARC
				</a>
			</div>
			<div class="p-3 text-lg"></div>
		</div>
	</div>
	<!--{@render CategorySummary('Labels')}-->
	{@render CategorySummary('Lists')}
</div>
