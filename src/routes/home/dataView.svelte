<script lang="ts">
	import type { CompletionReport } from '$lib/types';

	let { completionReport }: { completionReport: CompletionReport } = $props();
	let total = $derived(
		completionReport.complete + completionReport.incomplete + completionReport.needsReview
	);
</script>

<div class="w-full space-y-0.5 p-1 rounded-full shadow-inner h-auto bg-stone-950">
	<div class="flex w-auto space-x-1 h-1.5">
		{#if completionReport.complete > 0}
			<div
				class="bg-green-500 rounded-l-full opacity-70"
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
				class="bg-red-500 opacity-30 rounded-r-full border-red-400"
				style="width: {(completionReport.incomplete / total) * 100}%;"
			></div>
		{/if}
	</div>
</div>
