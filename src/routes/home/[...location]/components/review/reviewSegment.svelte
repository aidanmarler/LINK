<script lang="ts">
	import type { Database } from '$lib/database.types';
	import { card, card_dynamic, newStyle } from '$lib/styles';
	import type {
		ForwardTranslationRow,
		RelatedTranslations,
		ReviewComment,
		TranslationReviewRow
	} from '$lib/supabase/types';
	import { getEarliestEvent } from '$lib/supabase/utils';
	import { typeLabels } from '$lib/types';
	import { quintInOut } from 'svelte/easing';
	import { draw, fade } from 'svelte/transition';
	import CommentViewer from '../commentViewer.svelte';
	import CompletionIndicator from '../completionIndicator.svelte';
	import { compileModule } from 'svelte/compiler';
	import { onMount } from 'svelte';

	let {
		completed, // has segment already been reviewed?
		label, // like "question", "answer", "label", etc./
		segment, // original segment
		options, // options to select
		relatedReviews,
		error,
		saving,
		open = $bindable(), // is segment form open or hidden
		selectedTranslation = $bindable(), //id of translation selected as best (if not providing a new one)
		comments = $bindable(),
		ftranslation = $bindable(), // if providing a new translation, text will be here
		fcomment = $bindable() // if providing a new translation, comment is required and will be her
		//skipped = $bindable() // if skipped... if we have that
	}: {
		completed: boolean;
		label: Database['public']['Enums']['SegmentType'];
		segment: string;
		options: Record<string, ForwardTranslationRow[]>;
		relatedReviews: TranslationReviewRow[];
		error: string | undefined;
		saving: boolean;
		open: boolean;
		selectedTranslation: number | null | string;
		comments: Record<number, string | null>;
		ftranslation: string | null;
		fcomment: string | null;
		//skipped: boolean;
	} = $props();

	let inProgress: boolean = $derived.by(() => {
		if (selectedTranslation) return true;
		return false;
	});

	// Map comments both from Translation and Reviews to one object
	let commentMap: Record<string, string[]> = $derived.by(() => {
		const cMap: Record<string, string[]> = {};

		for (const [text, translations] of Object.entries(options)) {
			cMap[text] = [];
			for (const ft of translations) {
				if (ft.comment.length > 0) cMap[text].push(ft.comment);
				for (const r of relatedReviews) {
					const rComments = r.comments as ReviewComment;
					if (rComments[ft.id]) cMap[text].push(rComments[ft.id]!);
				}
			}
			cMap[text].push();
		}

		return cMap;
	});
</script>

<!-- Top Label and Controls -->
<div class="w-full flex justify-between">
	<div class="flex p-0.5">
		<!-- Open/Close Button-->
		<button
			class=" flex md:ml-4 group hover:underline cursor-pointer"
			onclick={() => {
				open = !open;
			}}
		>
			<div
				class="w-4 p-0.5 h-4 rounded-full
					group-hover:bg-white group-hover:fill-stone-600 group-hover:stroke-stone-600 stroke-stone-500
					dark:group-hover:bg-stone-800 dark:group-hover:fill-stone-400 dark:group-hover:stroke-stone-400 dark:stroke-stone-300"
			>
				{#if open}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class=" h-full w-full"
						width="24"
						height="24"
						viewBox="0 0 24 24"
					>
						<path
							in:draw={{ duration: 200, easing: quintInOut }}
							fill="none"
							stroke-width="4"
							stroke-linecap="round"
							d="M19 12.998H5v"
						/>
					</svg>{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class=" h-full w-full"
						width="24"
						height="24"
						viewBox="0 0 24 24"
					>
						<path
							in:draw={{ duration: 100, easing: quintInOut }}
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"
						/>
					</svg>{/if}
			</div>

			<span class="text-sm font-semibold italic text-stone-600">{typeLabels[label]}</span>
		</button>
		<!--Skip Button-->
		<!--Completion Indicator-->
		<CompletionIndicator
			{completed}
			{inProgress}
			skipped={false}
			{saving}
			completedText={'reviewed'}
		/>
		<!-- Error Message-->
		{#if error}
			<span class="text-red-800 h-5 font-semibold px-3 ml-2 border border-red-800 text-sm">
				{error}
			</span>
		{/if}
	</div>
</div>

<!-- Main Content-->
<div class="flex pl-4 w-full h-full transition-all {open ? ' max-h-300 duration-500 ' : 'max-h-0'}">
	<!-- Review Form -->
	{#if open}
		<div class="w-full mr-6 h-full">
			<div
				in:fade={{ duration: 200 }}
				class="rounded border-2 border-inherit w-full h-full z-0 flex flex-wrap {completed
					? 'opacity-70'
					: '  '} {card.translate.complete}"
			>
				<!--Original Segment-->
				<h3 class="w-full border-b border-inherit px-2">
					{segment}
				</h3>

				<!-- Translation Options to select from -->
				{#if options}
					{#each Object.entries(options) as [text, option], index}
						{@const optionId:number = getEarliestEvent(Object.values(option)).id}
						<div class="relative w-full">
							<fieldset id={segment} class="w-full flex border-inherit" role="radiogroup">
								<!-- Option -->
								<label
									class="w-1/2 {completed
										? ' '
										: ' hover:bg-stone-100  cursor-pointer '}  border-r border-t border-inherit px-2"
								>
									<input
										type="radio"
										name={segment}
										value={optionId}
										checked={selectedTranslation == optionId}
										disabled={completed}
										onclick={() => {
											if (error) error = undefined;
											if (completed) return;
											if (selectedTranslation === optionId) {
												selectedTranslation = null; // Deselect
											} else {
												selectedTranslation = optionId; // Select
											}
										}}
										class="accent-green-600 disabled:accent-amber-300 {completed
											? ' '
											: 'cursor-pointer'}"
									/>
									{text}
								</label>

								<!-- Option's Comments -->
								<div
									class="w-1/2 border-l px-2 flex font-normal text-stone-800 italic border-t border-inherit overflow-y-auto"
								>
									{#each commentMap[text] as comment, i}
										{comment}
										{#if i < commentMap[text].length - 1}
											&nbsp;| &nbsp;
										{/if}
									{/each}
								</div>
							</fieldset>

							<!-- Add comment button-->
							<div class="w-6 -right-[25.5px] top-0 opacity-100 absolute p-0.5 h-5">
								{#if !completed}
									<CommentViewer bind:completed bind:comment={comments[optionId]} />
								{/if}
							</div>
						</div>
					{/each}
				{/if}

				<!-- Suggest New Translation -->
				{#if completed}
					<!-- existing translations and comment -->
					<div class=" w-1/2 border-r px-2">{ftranslation}</div>
					<div class=" w-1/2 border-l px-2">{fcomment}</div>
				{:else}
					<div class=" border-t-2 border-t-stone-400 w-1/2 border-r flex min-h-full border-inherit">
						<label
							class=" pl-2 pr-3 border-inherit rounded-b-md flex {completed
								? ' '
								: ' hover:bg-stone-100  cursor-pointer '}"
						>
							<input
								type="radio"
								name={segment}
								value={'new'}
								checked={selectedTranslation == 'new'}
								disabled={completed}
								onclick={() => {
									if (completed) return;
									if (selectedTranslation === 'new') {
										selectedTranslation = null; // Deselect
									} else {
										selectedTranslation = 'new'; // Select
									}
								}}
								class="accent-green-600 disabled:accent-amber-300 {completed
									? ' '
									: 'cursor-pointer'}"
							/>
						</label>

						<!-- translation input -->
						<textarea
							placeholder="Translate segment here..."
							class="resize-none bg-white border-inherit w-full dark:bg-black px-2"
							rows="1"
							bind:value={ftranslation}
							onkeydown={() => {
								if (completed) return;
								selectedTranslation = 'new'; // Select
							}}
						></textarea>
					</div>

					<div class="w-1/2 border-t-2 border-t-stone-400 border-l min-h-full border-inherit">
						<!-- comment input -->
						<textarea
							placeholder="Provide justification here..."
							class="bg-white h-5 border-inherit dark:bg-black rounded-br w-full min-h-full px-2"
							rows="1"
							bind:value={fcomment}
							onkeydown={() => {
								if (completed) return;
								selectedTranslation = 'new'; // Select
							}}
						></textarea>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
