<script lang="ts">
	import type { PromiseSuggestions } from '$lib/types';
	import { getSuggestedTranslation, getSuggestedTranslations } from './suggestion';
	let { id, profileId, allSuggestions }: { id: number; profileId:string; allSuggestions: PromiseSuggestions } = $props();
	let suggestionPromise = $derived.by(() => getSuggestedTranslation([id], profileId));
	$inspect(suggestionPromise);
</script>

<div class="bg-linear-30 from-emerald-300/30 bg-sky-300/20 p-1 flex flex-col">
	{#await suggestionPromise}
		... Loading sugggestions
	{:then suggestionResult}
		{@const state = 'Accepted'}
		{@const suggestion = Object.values(suggestionResult)}
		{#each sugs as [_i, s]}
			<div class="p-1 flex w-full">
				<button
					class="bg-stone-200 flex font-normal hover:bg-stone-100 cursor-pointer opacity-80 hover:opacity-100 rounded-lg hover:shadow hover"
				>
					<div class="flex flex-col px-1">
						<p title="Percent match with original text" class="hover:bg-white hover:shadow">
							Score: {Math.round(s.score * 100)}%
						</p>
						<p>Accepted</p>
					</div>

					{s.forward_translation_text}
				</button>
			</div>
		{/each}
	{/await}
</div>
