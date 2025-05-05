<script lang="ts">
	import { determineCompletionIndicator, userProfile } from '$lib/global.svelte';
	import type { CompletionIndicator, OriginalItem_Lists, TranslationLanguage } from '$lib/types';
	import { onMount } from 'svelte';
	import ConfirmationModal from './confirmationModal.svelte';

	let { originalKey, originalItem }: { originalKey: string; originalItem: OriginalItem_Lists } =
		$props();

	let suggestedText: string | null = $state(null);
	let selectedTranslationId: string | null = $state(null);
	let newSuggestionText: string = $state('');

	let isSuggestingNew: boolean = $state(false);
	let openConfirmationModal: boolean = $state(false);

	let canSubmit: boolean = $derived(
		selectedTranslationId || (isSuggestingNew && newSuggestionText.length > 0)
	);

	let questionState: CompletionIndicator = $derived.by(() => {
		if (userProfile.user == null) return 'incomplete';
		return determineCompletionIndicator(userProfile.user.id, originalItem);
	});

	// Clear selection state
	const clearSelection = () => {
		selectedTranslationId = null;
		isSuggestingNew = false;
	};
</script>

{#if openConfirmationModal && suggestedText}
	<ConfirmationModal
		bind:openConfirmationModal
		originalText={originalKey}
		translatedText={suggestedText}
		isNewTranslation={isSuggestingNew}
		translationId={selectedTranslationId}
		newTranslationData={{ list: '', sublist: 'string', original: 'string' }}
	/>
{/if}

<!-- Form Container -->
{#if originalKey && originalItem}
	<div class="w-full block text-center font-medium rounded-xs my-28 p-1">
		<h3 class="tracking-wider italic text-3xl font-serif mb-10">
			{originalKey}
		</h3>
 
		<!-- Existing Translation Options -->
		<fieldset class="mb-6 flex flex-col items-center w-full" role="radiogroup">
			{#each Object.entries(originalItem) as [option]}
				<label
					class="inline-flex items-center p-4 rounded-md cursor-pointer border
						{selectedTranslationId === originalItem[option].id && !isSuggestingNew
						? 'bg-green-900 border-green-700 hover:border-green-500'
						: 'bg-stone-900 border-stone-600 hover:border-stone-400'}"
				>
					<input
						type="radio"
						name="translation"
						value={originalItem[option].id}
						checked={selectedTranslationId === originalItem[option].id && !isSuggestingNew}
						onclick={() => {
							if (selectedTranslationId === originalItem[option].id) {
								selectedTranslationId = null; // Deselect
							} else {
								selectedTranslationId = originalItem[option].id;
								isSuggestingNew = false;
								suggestedText = originalItem[option].listTranslation.translation;
							}
						}}
						class="accent-green-600 cursor-pointer"
					/>
					<p
						class="ml-3 text-left cursor-text px-3 text-xl italic font-serif tracking-wider hover:bg-stone-500/20 duration-100"
					>
						{originalItem[option].listTranslation.translation}
					</p>
				</label>
			{/each}
		</fieldset>

		<!-- Suggest New Translation -->
		<div class="flex flex-col items-center w-full">
			<label
				class=" w-auto font-thin text-xl p-3 rounded-md cursor-pointer border
						{isSuggestingNew
					? 'bg-green-900 border-green-700 hover:border-green-500'
					: 'bg-stone-900 border-stone-600 hover:border-stone-400'}"
			>
				<input
					type="radio"
					name="translation"
					checked={selectedTranslationId === null && isSuggestingNew}
					onclick={() => {
						if (isSuggestingNew) {
							isSuggestingNew = false; // Deselect
						} else {
							selectedTranslationId = null;
							isSuggestingNew = true;
							suggestedText = newSuggestionText;
						}
					}}
					class="accent-green-600 mr-3 cursor-pointer"
				/>
				Suggest a new translation
				<textarea
					class="w-full mt-3 p-4 rounded-md text-xl font-serif tracking-wide
						{isSuggestingNew ? 'border-green-600 bg-stone-900' : ' bg-stone-950'}"
					placeholder="Write your own translation..."
					bind:value={newSuggestionText}
					oninput={() => {
						isSuggestingNew = newSuggestionText.trim().length > 0;
						if (isSuggestingNew) selectedTranslationId = null;
						suggestedText = newSuggestionText;
					}}
					rows={3}
				></textarea>
			</label>
		</div>

		<!-- Bottom Buttons -->
		<div class="w-full max-w-96 mt-10 text-xl space-x-5 font-semibold flex justify-around">
			<button
				disabled={!selectedTranslationId && !isSuggestingNew}
				class="block bg-red-700/50 border-2 border-red-700 h-15 w-full px-6 py-1 rounded-lg justify-around
				{selectedTranslationId || isSuggestingNew
					? 'cursor-pointer opacity-80 hover:opacity-100'
					: 'opacity-30'}"
				onclick={clearSelection}
			>
				Clear Selection
			</button>
			<button
				disabled={!canSubmit}
				class="block bg-green-700/50 border-2 border-green-700 h-15 w-full px-6 p-1 rounded-lg justify-around
				{canSubmit ? 'cursor-pointer opacity-80 hover:opacity-100' : 'opacity-30'}"
				onclick={() => {
					openConfirmationModal = true;
				}}
			>
				Submit
			</button>
		</div>
	</div>
{/if}
