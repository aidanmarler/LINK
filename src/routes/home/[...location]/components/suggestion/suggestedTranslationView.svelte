<script lang="ts">
	import { fade } from 'svelte/transition';
	import { getSuggestedTranslation } from './suggestion';
	import { onMount } from 'svelte';
	import type { TranslationStep } from '$lib/supabase/types';
	import type { FindSimilarSegmentsResult } from '$lib/types';
	let {
		id,
		profileId,
		open = $bindable(),
		onSuggest,
		confidence = $bindable(),
		count = $bindable()
	}: {
		id: number;
		profileId: string;
		open: boolean;
		onSuggest: (suggestion: string) => void;
		confidence: Confidence;
		count: number | undefined;
	} = $props();
	type Confidence = 0 | 1 | 2;
	let suggestionPromise = $derived.by(() => getSuggestedTranslation(id, profileId));

	onMount(async () => {
		const result = await suggestionPromise;
		count = result.length;

		confidence = calcGeneralConfidence(result);

		if (confidence == 2) open = true;
	});

	const stepLabel = (s: TranslationStep) =>
		s == 'admin' || s == 'adjudication' ? 'Accepted' : 'Under Review';
	const stepColor = (l: 'Accepted' | 'Under Review') => (l == 'Accepted' ? 'text-sky-700' : '');
	const matchColor = (m: number) =>
		m == 100 ? 'text-sky-700' : m >= 85 ? 'text-green-700' : 'text-yellow-700';
	const suggestionConfidence = (m: number, l: 'Accepted' | 'Under Review') => {
		let score: Confidence = 0;
		if (m == 100 && l == 'Accepted') score = 2;
		else if (l == 'Accepted') score = 1;
		else if (m == 100) score = 1;
		return score;
	};

	const calcGeneralConfidence = (matches: FindSimilarSegmentsResult): Confidence => {
		let totalConfidence: Confidence = 0;
		matches.forEach((m) => {
			const conf = suggestionConfidence(
				Math.round(m.score * 100),
				stepLabel(m.accepted_translation_step)
			);
			if (conf > totalConfidence) totalConfidence = conf;
		});
		return totalConfidence;
	};

	const borderColor = (c: Confidence) =>
		c == 0
			? ' border-yellow-600/70 hover:border-yellow-600/90 active:border-yellow-600 shadow-yellow-600/50 '
			: c == 1
				? ' border-green-700/70 hover:border-green-700/90 active:border-green-700 shadow-green-700/50 '
				: 'border-sky-600/70 hover:border-sky-600/90 active:border-sky-600 shadow-sky-600/50';
</script>

{#snippet symbol()}
	<span></span>
{/snippet}

<div
	class="{open
		? 'border-t-2 max-h-50 suggestion-open '
		: 'max-h-0 suggestion-close '} overflow-scroll
		"
>
	{#if open}
		<div transition:fade={{ duration: 150 }}>
			{#await suggestionPromise}
				<p class=" px-2 italic opacity-70">... Loading sugggestions</p>
			{:then suggestionResult}
				{#if suggestionResult.length == 0}
					<p class=" px-2 italic opacity-70">No suggested translations.</p>
				{:else}
					{@const suggestion = Object.values(suggestionResult)}
					<div class=" bg-conic-60 from-sky-500 to-green-600">
						<div class="flex w-full bg-stone-200/95 backdrop-blur-3xl p-1 px-1.5 flex-col">
							{#each suggestion as s}
								{@const label = stepLabel(s.accepted_translation_step)}
								{@const score = Math.round(s.score * 100)}
								{@const conf = suggestionConfidence(score, label)}
								<div class="p-0.5 flex w-full">
									<button
										onclick={() => onSuggest(s.forward_translation_text)}
										class=" {borderColor(
											conf
										)} bg-stone-100 w-full px-1 p-0.5 border-2 flex-col active:bg-white shadow-none flex font-normal hover:bg-stone-100 cursor-pointer opacity-80 hover:opacity-100 rounded-lg hover:shadow"
									>
										<div
											class="flex italic border-b border-stone-400/50 text-stone-700/90 font-semibold flex-row text-sm"
										>
											{@render symbol()}
											<p
												title="Percent match with original text"
												class="pl-1 pr-2 rounded-sm hover:bg-stone-200 cursor-context-menu"
											>
												<b class={matchColor(score)}>{score}%</b> match
											</p>
											—

											<p
												title={label == 'Accepted'
													? 'Translation was accepted as correct.'
													: 'Translation has not yet been accepted as correct.'}
												class="px-2 rounded-sm hover:bg-stone-200 cursor-context-menu flex items-center {stepColor(
													label
												)}"
											>
												{#if label == 'Accepted'}
													<svg
														class="w-5 h-full px-0.5 stroke-sky-600 fill-sky-600"
														xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 12 12"
														stroke-width="0.5"
													>
														<path
															fill-rule="evenodd"
															d="M10.78 2.62a.75.75 0 0 1 0 1.06L4.683 9.777a.75.75 0 0 1-1.069-.009L1.211 7.284a.75.75 0 0 1 1.078-1.043l1.873 1.936L9.72 2.62a.75.75 0 0 1 1.06 0"
															clip-rule="evenodd"
														/>
													</svg>
												{:else}
													<span
														class="w-2.5 h-2.5 mr-0.5 border-yellow-700 border-2 rounded-sm bg-yellow-700/0"
													></span>
												{/if}

												{label}
											</p>
										</div>
										<p class=" text-sm text-left px-1">
											{s.segment_text}
										</p>
										<p class="text-black text-left px-1">
											{s.forward_translation_text}
										</p>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/await}
		</div>
	{/if}
</div>
