<script lang="ts">
	import type { CompletionReport } from '$lib/types';

	let { completionReport }: { completionReport: CompletionReport } = $props();
	let total = $derived(
		completionReport.complete + completionReport.incomplete + completionReport.needsReview
	);
	let ratio = $derived(
		(( completionReport.complete / total ) * 100 ).toFixed(1)
	);
</script>

<div class="flex text-xs italic">
	{ratio}% complete ({completionReport.complete} / {total})
</div>

<div class="w-full space-y-0.5 p-1 rounded-full h-auto dark:bg-stone-950">
	<div class="flex w-auto space-x-1 h-1.5">
		{#if completionReport.complete > 0}
			<div
				class="bg-green-700 dark:bg-green-500 rounded-l-full opacity-90"
				style="width: {(completionReport.complete / total) * 100}%;"
			></div>
		{/if}
		{#if completionReport.needsReview > 0}
			<div
				class="bg-yellow-500 opacity-70 border-yellow-400"
				style="width: {(completionReport.needsReview / total) * 100}%;"
			></div>
		{/if}
		{#if completionReport.incomplete > 0}
			<div
				class="bg-pink-900/40 dark:bg-pink-700/30 rounded-r-full"
				style="width: {(completionReport.incomplete / total) * 100}%;"
			></div>
		{/if}
	</div>
</div>
