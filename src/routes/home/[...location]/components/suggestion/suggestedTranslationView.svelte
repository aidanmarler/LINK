<script lang="ts">
	import { fade } from 'svelte/transition';
	import { getSuggestedTranslation } from './suggestion';
	import { onMount } from 'svelte';
	let {
		id,
		profileId,
		open,
		onSuggest,
		count = $bindable()
	}: {
		id: number;
		profileId: string;
		open: boolean;
		onSuggest: (suggestion: string) => void;
		count: number | undefined;
	} = $props();
	let suggestionPromise = $derived.by(() => getSuggestedTranslation(id, profileId));

	onMount(async () => {
		const result = await suggestionPromise;
		count = result.length;
	});
</script>

<div
	class="{open
		? 'border-t-2 max-h-50 '
		: 'max-h-0 suggestion-close '} transition-[max-height] duration-300 overflow-scroll
		"
>
	{#if open}
		<div
			transition:fade={{ duration: 300 }}
			class="bg-linear-30 from-emerald-300/30 bg-sky-300/20 p-1 flex flex-col"
		>
			{#await suggestionPromise}
				... Loading sugggestions
			{:then suggestionResult}
				{@const suggestion = Object.values(suggestionResult)}
				{#each suggestion as s}
					<div class="p-1 flex w-full">
						<button
							onclick={() => onSuggest(s.forward_translation_text)}
							class="bg-stone-200 flex font-normal hover:bg-stone-100 cursor-pointer opacity-80 hover:opacity-100 rounded-lg hover:shadow hover"
						>
							<div class="flex flex-col px-1">
								<p title="Percent match with original text" class="hover:bg-white hover:shadow">
									Score: {Math.round(s.score * 100)}%
								</p>
								<p>{s.accepted_translation_step}</p>
							</div>

							{s.forward_translation_text}
						</button>
					</div>
				{/each}
			{/await}
		</div>
	{/if}
</div>
