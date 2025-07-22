<script lang="ts">
	import type { CompletionReport } from '$lib/types';
	import { fade } from 'svelte/transition';
	type Options = {
		showKey?: boolean;
		large?: boolean;
	};

	let { completionReport, options }: { completionReport: CompletionReport; options: Options } =
		$props();
	let total = $derived(
		completionReport.complete + completionReport.incomplete + completionReport.needsReview
	);
	let ratio = $derived(((completionReport.complete / total) * 100).toFixed(1));
</script>

<div in:fade={{ duration: 1000 }} class="w-full p-1 h-auto">
	<div class="flex w-auto {options.large ? 'h-4' : 'h-1.5'}">
		{#if completionReport.complete > 0}
			<div
				class="bg-green-700 dark:bg-green-500 opacity-90 rounded-l-sm
				{completionReport.incomplete == 0 && completionReport.needsReview == 0 ? 'rounded-r-sm' : ''}"
				style="width: {(completionReport.complete / total) * 100}%;"
			></div>
		{/if}
		{#if completionReport.needsReview > 0}
			<div
				class="bg-amber-600 dark:bg-amber-700 opacity-70
				{completionReport.complete == 0 ? 'rounded-l-sm' : ''}
				{completionReport.incomplete == 0 ? 'rounded-r-sm' : ''}"
				style="width: {(completionReport.needsReview / total) * 100}%;"
			></div>
		{/if}
		{#if completionReport.incomplete > 0}
			<div
				class="bg-pink-900/40 dark:bg-pink-700/30 rounded-r-sm
				{completionReport.complete == 0 && completionReport.needsReview == 0 ? 'rounded-l-sm' : ''}"
				style="width: {(completionReport.incomplete / total) * 100}%;"
			></div>
		{/if}
	</div>
</div>

{#if options.showKey}
	<div
		class="flex flex-wrap justify-center {options.large == true
			? 'text-md'
			: 'text-xs'} font-normal"
	>
		{#if completionReport.complete > 0}
			<div class="justify-center mx-0.5 flex flex-row p-1 rounded-md">
				<div
					class="bg-green-700 dark:bg-green-500 rounded-md opacity-90 {options.large
						? ' mt-1 h-3 w-3 '
						: ' h-2 w-2 '}"
				></div>
				<p class="-mt-1 px-1">{completionReport.complete} Complete</p>
			</div>
		{/if}
		{#if completionReport.needsReview > 0}
			<div class="justify-left mx-0.5 flex flex-row p-1 rounded-full">
				<div
					class="bg-amber-600 dark:bg-amber-700 rounded-full opacity-90 {options.large
						? ' mt-1 h-3 w-3 '
						: ' h-2 w-2 '}"
				></div>
				<p class="-mt-1 px-2">{completionReport.needsReview} To Review</p>
			</div>
		{/if}
		{#if completionReport.incomplete > 0}
			<div class="justify-left mx-0.5 flex flex-row p-1 rounded-full">
				<div
					class="bg-pink-900/40 dark:bg-pink-700/40 rounded-full opacity-90 {options.large
						? ' mt-1 h-3 w-3 '
						: ' h-2 w-2 '}"
				></div>
				<p class="-mt-1 px-2">{completionReport.incomplete} Incomplete</p>
			</div>
		{/if}
	</div>
{/if}
