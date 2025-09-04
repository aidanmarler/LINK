<script lang="ts">
	import { determineCompletionIndicator, userProfile } from '$lib/global.svelte';
	import type { SegmentStatus, OriginalItem_Lists, TranslationLanguage } from '$lib/types';
	import { onMount } from 'svelte';
	import ConfirmationModal from './confirmationModal.svelte';
	import { card_dynamic } from '$lib/styles';

	let {
		originalKey,
		originalItem,
		completionStatus
	}: { originalKey: string; originalItem: OriginalItem_Lists; completionStatus: SegmentStatus } =
		$props();

	let suggestedText: string | null = $state(null);
	let selectedTranslationId: string | null = $state(null);
	let newSuggestionText: string = $state('');

	let isSuggestingNew: boolean = $state(false);
	let openConfirmationModal: boolean = $state(false);

	let canSubmit: boolean = $derived(
		selectedTranslationId || (isSuggestingNew && newSuggestionText.length > 0)
	);

	let questionState: SegmentStatus = $derived.by(() => {
		if (userProfile.user == null) return 'incomplete';
		return determineCompletionIndicator(userProfile.user.id, originalItem);
	});

	// Clear selection state
	const clearSelection = () => {
		selectedTranslationId = null;
		isSuggestingNew = false;
	};

	const greenButton =
		' bg-green-600/20 border-green-600 hover:border-green-500 dark:bg-green-900 dark:border-green-700 dark:hover:border-green-500 ';
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
	<div class="w-full text-center items-center font-medium rounded-xs p-1">
		<p>
			{completionStatus}
		</p>
		<h3 class="tracking-wider italic text-3xl font-serif mt-5 mb-10">
			{originalKey}
		</h3>

		<div class="w-full justify-around flex">
			<div class="w-full max-w-[600px]">
				<!-- Existing Translation Options -->
				<fieldset class="mb-6 flex-wrap items-center w-full" role="radiogroup">
					{#each Object.entries(originalItem) as [option]}
						<label
							class="inline-flex items-center my-0.5 mx-0.5 p-4 rounded-md cursor-pointer border hover:shadow
								{selectedTranslationId === originalItem[option].id && !isSuggestingNew
								? greenButton
								: card_dynamic +
									' border-stone-600 hover:bg-white hover:border-stone-900 dark:hover:bg-stone-900 dark:border-stone-500 dark:hover:border-stone-200'}"
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
							{#if userProfile.user && originalItem[option].viewReport.users_voted?.includes(userProfile.user.id)}
								<img src="/checkmark.svg" alt="Voted" class="w-6 h-6 ml-2" />
							{/if}
							<p
								class="ml-3 text-left cursor-text px-3 text-lg italic font-serif tracking-wider hover:bg-stone-500/20 "
							>
								{originalItem[option].listTranslation.translation}
							</p>

							<span
								>{userProfile.user &&
								originalItem[option].viewReport.users_seen?.includes(userProfile.user.id)
									? '1'
									: '0'}
							</span>
							
						</label>
					{/each}
				</fieldset>

				<!-- Suggest New Translation -->
				<div class="flex flex-col items-center w-full">
					<label
						class=" w-full font-thin text-xl p-3 rounded-md cursor-pointer border
				{isSuggestingNew ? greenButton : card_dynamic}"
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
				{isSuggestingNew
								? 'border-green-600 bg-stone-300 dark:bg-stone-800'
								: ' bg-stone-300  dark:bg-stone-800'}"
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
				<div class="w-full mt-10 text-xl space-x-5 font-semibold flex justify-around">
					<button
						disabled={!selectedTranslationId && !isSuggestingNew}
						class="block bg-pink-500/30 dark:bg-pink-900 border-2 dark:border-pink-600 border-pink-500 h-15 w-64 px-3 py-1 rounded-lg justify-around
		{selectedTranslationId || isSuggestingNew
							? 'cursor-pointer hover:border-pink-500 bg-opacity-80 hover:opacity-100'
							: 'opacity-30'}"
						onclick={clearSelection}
					>
						Clear Selection
					</button>
					<button
						disabled={!canSubmit}
						class="block bg-green-500/40 dark:bg-green-800 border-2 border-green-600 h-15 w-full px-6 p-1 rounded-lg justify-around
							{canSubmit ? 'cursor-pointer opacity-80 hover:bg-green-800 hover:opacity-100' : 'opacity-30'}"
						onclick={() => {
							openConfirmationModal = true;
						}}
					>
						Submit
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
