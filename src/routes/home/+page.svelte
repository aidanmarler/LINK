<script lang="ts">
	import { onMount } from 'svelte';
	import type { Category, TranslationLanguage } from '$lib/types';
	import { global_address, reset_address, userProfile } from '$lib/global.svelte';
	import { fade, fly } from 'svelte/transition';
	import { card_dynamic } from '$lib/styles';

	onMount(() => {
		reset_address();
		console.log($state.snapshot(global_address));
	});
</script>

{#snippet CategorySummary(category: Category)}
	<div class="w-full mt-5">
		<div class="w-full rounded-lg {card_dynamic}">
			<div class="flex justify-between items-end p-2 px-4 mb-3 border-b border-inherit">
				<a
					data-sveltekit-preload-code="eager"
					class="text-3xl hover:underline font-semibold"
					href="/home/{category.toLowerCase()}"
				>
					{category}
				</a>

				<p class="italic">3 questions to check, 21% complete</p>
			</div>
			<div class="p-3">
				<div class="flex justify-around">
					<p>Items Translated: 63 of 300</p>
					<p>Lists Completed: 1 of 7</p>
				</div>
				<div
					class="w-full mt-2 space-y-0.5 p-0.5 rounded-sm shadow-inner h-auto dark:bg-stone-950"
				>
					<div class="flex w-auto space-x-0.5 h-3">
						<div class=" bg-green-500 opacity-70 rounded-xs w-[19%]"></div>
						<div class="bg-yellow-500 opacity-70 rounded-xs border-yellow-400 w-[2%]"></div>
						<div class="bg-red-500 opacity-70 rounded-xs border-red-400 w-[79%]"></div>
					</div>

					<div class="flex w-auto space-x-0.5 h-3">
						<div class=" bg-blue-500 opacity-50 rounded-xs border-2 border-blue-400 w-[57%]"></div>
						<div class="bg-blue-400 opacity-50 rounded-xs border-2 border-blue-300 w-[30%]"></div>
						<div class="bg-blue-300 opacity-50 rounded-xs border-2 border-blue-200 w-[30%]"></div>
						<div class="bg-red-200 opacity-50 rounded-xs border-2 border-red-100 w-[79%]"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/snippet}

<h2 in:fade={{ duration: 500, delay: 100 }} out:fade={{ duration: 100 }}>
	Welcome, <em in:fade={{ duration: 1000 }}>{userProfile.user?.name}</em>
</h2>

<div in:fly={{ y: 20, duration: 500, delay: 100 }} out:fly={{ y: 10, duration: 100 }}>
	{@render CategorySummary('Lists')}
</div>
