<script lang="ts">
	import { card, card_static } from '$lib/styles';
	import { typeLabels, type forwardStatus } from '$lib/types';
	import { quintInOut, quintOut } from 'svelte/easing';
	import { blur, draw, fade, fly, scale } from 'svelte/transition';
	import type { Database } from '$lib/database.types';
	import CommentViewer from '../commentViewer.svelte';
	import CompletionIndicator from '../completionIndicator.svelte';

	let {
		completed,
		label,
		segment,
		saving,
		translation = $bindable(),
		open = $bindable(),
		comment = $bindable(),
		skipped = $bindable()
	}: {
		completed: boolean;
		label: Database['public']['Enums']['SegmentType'];
		segment: string;
		saving: boolean;
		translation: string;
		open: boolean;
		comment: string;
		skipped: boolean;
	} = $props();

	let inProgress: boolean = $derived(translation.trim().length > 0);

	let completion: forwardStatus = $derived.by(() => {
		if (translation.length > 1) return 'inProgress';
		if (completed) return 'forwardTranslated';
		if (skipped) return 'skipped';
		return 'toForwardTranslate';
	});
</script>

<div>
	<div class="w-full flex justify-between">
		<div class="flex w-full justify-between items-center">
			<div class="flex w-1/3">
				<!-- Open/Close Button -->
				<button
					class=" flex ml-4 group hover:underline cursor-pointer"
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

				<!-- Completion Indicator -->
				<CompletionIndicator
					{completed}
					{inProgress}
					{skipped}
					{saving}
					completedText={'translated'}
				/>
			</div>

			<div class="flex pl-0.5 h-6 w-2/3">
				<!-- Skip button -->
				{#if !completed && open}
					<button
						in:fade={{ duration: 100 }}
						title="Skip translating this segment"
						class="  flex items-center px-2.5 rounded-t-md group border-2 border-b-0 text-sm border-stone-800 dark:border-stone-400 cursor-pointer
						 {skipped
							? ' opacity-80 hover:opacity-100 text-stone-200 hover:text-stone-100 hover: bg-stone-800 dark:text-stone-950 dark:bg-stone-400'
							: 'text-stone-800 dark:text-stone-400  opacity-50 hover:opacity-100'} "
						onclick={() => {
							skipped = !skipped;
						}}
					>
						<span class="text-sm font-bold">Skip Translation</span>

						<div class="w-5 p-0.5 text-inherit h-full">
							<svg
								class="w-full h-full"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 28 28"
							>
								<path
									fill="currentColor"
									d="M15.637 4.857c-1.066-.845-2.635-.086-2.635 1.273v4.57L5.636 4.858c-1.065-.845-2.634-.086-2.634 1.273V21.87c0 1.359 1.57 2.118 2.634 1.273l7.366-5.84v4.565c0 1.359 1.57 2.118 2.634 1.273l9.637-7.64a1.917 1.917 0 0 0 0-3.004z"
								/>
							</svg>
						</div>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div
		class="flex pl-4 w-full h-full transition-all {open
			? ' max-h-[1200px] duration-[.5s] '
			: 'max-h-0'}"
	>
		{#if open}
			<div
				in:fade={{ duration: 200 }}
				class="rounded-md border-2 w-full flex {completed ? 'opacity-70' : '  '} {completed
					? card.translate.complete
					: card.translate.incomplete}"
			>
				<!--Original Segment-->
				<div class="w-1/3 border-r-2 border-inherit px-2">
					{segment}
				</div>
				<!--Translation Area-->
				{#if skipped}
					<!-- skipped message -->
					<div class=" w-2/3 px-2 italic opacity-60">Translation Skipped</div>
				{:else if completed}
					<!-- existing translation -->
					<div class=" w-2/3 px-2">{translation}</div>
				{:else}
					<!-- text input translation -->
					<textarea
						placeholder="Translate segment here..."
						class="bg-white rounded-r dark:bg-black w-2/3 px-2 min-h-full"
						rows="1"
						bind:value={translation}
					></textarea>
				{/if}
			</div>

			<!--Comment button-->
			<div class="w-6 p-0.5 h-5">
				<CommentViewer bind:completed bind:comment />
			</div>
		{/if}
	</div>
</div>
