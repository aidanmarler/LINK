<script lang="ts">
	import { onMount } from 'svelte';
	import type { Category, TranslationLanguage } from '$lib/types';
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

<h2 in:fade={{ duration: 500, delay: 100 }} out:fade={{ duration: 100 }}>
	Welcome, <em in:fade={{ duration: 1000 }}>{userProfile.user?.name}</em>
</h2>

<div in:fly={{ y: 20, duration: 500, delay: 100 }} out:fly={{ y: 10, duration: 100 }}>
	{@render CategorySummary('Questions')}
	{@render CategorySummary('Completion Guide')}
	{@render CategorySummary('Labels')}
	{@render CategorySummary('Lists')}
</div>
