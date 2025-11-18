<script lang="ts">
	import { card, card_static } from '$lib/styles';
	import type { forwardStatus } from '$lib/types';
	import { quintInOut, quintOut } from 'svelte/easing';
	import { blur, draw, fade, fly, scale } from 'svelte/transition';
	import type { Database } from '$lib/database.types';
	import CommentViewer from './commentViewer.svelte';

	let {
		completed,
		label,
		segment,
		translation = $bindable(),
		open = $bindable(),
		comment = $bindable(),
		skipped = $bindable()
	}: {
		completed: boolean;
		label: Database['public']['Enums']['SegmentType'];
		segment: string;
		translation: string;
		open: boolean;
		comment: string;
		skipped: boolean;
	} = $props();

	let inProgress: boolean = $derived(translation.length > 0);

	const typeLabels: Record<Database['public']['Enums']['SegmentType'], string> = {
		formLabel: 'Form',
		sectionLabel: 'Section',
		question: 'Question',
		answerOption: 'Answer',
		definition: 'Definition',
		completionGuide: 'Completion Guide',
		listItem: 'Option'
	};

	let completion: forwardStatus = $derived.by(() => {
		if (translation.length > 1) return 'inProgress';
		if (completed) return 'forwardTranslated';
		if (skipped) return 'skipped';
		return 'toForwardTranslate';
	});
</script>

<div>
	<div class="w-full flex justify-between">
		<div class="flex p-0.5">
			<button
				class=" flex ml-4 group hover:underline cursor-pointer"
				onclick={() => {
					open = !open;
				}}
			>
				<div
					class="w-4 p-0.5 group-hover:bg-stone-100/70 group-hover:fill-stone-600 group-hover:stroke-stone-600 fill-stone-500 stroke-stone-500 h-4 rounded-full"
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
			<!--<a href="/{label}"></a>-->
			{#if !completed}
				<button
					class=" flex px-2.5 {skipped
						? ' opacity-90 hover:opacity-100 text-stone-200 bg-stone-800 dark:text-stone-950 dark:bg-stone-400'
						: 'text-stone-800 dark:text-stone-400 opacity-50 hover:opacity-60'} hover:shadow-xs rounded-full ml-4 group border-2 border-stone-800 dark:border-stone-400 cursor-pointer"
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
			<!--Completion Indicator-->
			<div class="w-5 h-5 ml-1 stroke-stone-500 fill-stone-500">
				{#if completed && skipped}
					<span title="Translation skipped">
						<svg
							class="w-full p-[2px] h-full border bg-stone-700/10 border-stone-700 stroke-stone-700 fill-stone-700 dark:bg-stone-500/10 dark:border-stone-500 dark:stroke-stone-500 dark:fill-stone-500"
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
					</span>
				{:else if completed}
					<span title="Translated">
						<svg
							class="w-full p-[1px] h-full bg-green-700/10 border border-green-700 rounded-full stroke-green-700 fill-green-700"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 12 12"
							stroke-width="0"
						>
							<path
								fill-rule="evenodd"
								d="M10.78 2.62a.75.75 0 0 1 0 1.06L4.683 9.777a.75.75 0 0 1-1.069-.009L1.211 7.284a.75.75 0 0 1 1.078-1.043l1.873 1.936L9.72 2.62a.75.75 0 0 1 1.06 0"
								clip-rule="evenodd"
							/>
						</svg>
						<!--
						<svg
							class="w-full p-[1px] h-full stroke-green-700 fill-green-700"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 16 16"
							stroke-width="0"
						>
							<path
								fill-rule="evenodd"
								d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m3.1-8.55a.75.75 0 1 0-1.2-.9L7.419 8.858L6.03 7.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.13-.08z"
								clip-rule="evenodd"
							/>
						</svg>
						<svg
							class="w-full p-0.5 h-full stroke-green-700 fill-green-700"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 48 48"
						>
							<g fill="none" stroke-linejoin="round" stroke-width="6">
								<path
									d="M24 44a19.94 19.94 0 0 0 14.142-5.858A19.94 19.94 0 0 0 44 24a19.94 19.94 0 0 0-5.858-14.142A19.94 19.94 0 0 0 24 4A19.94 19.94 0 0 0 9.858 9.858A19.94 19.94 0 0 0 4 24a19.94 19.94 0 0 0 5.858 14.142A19.94 19.94 0 0 0 24 44Z"
								/>
								<path stroke-linecap="round" d="m16 24l6 6l12-12" />
							</g>
						</svg>-->
					</span>
				{:else if inProgress}
					<span title="Translation to submit">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-full h-full p-0.5 stroke-green-700 fill-stone-700"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"
							>
								<animateTransform
									attributeName="transform"
									dur="2s"
									repeatCount="indefinite"
									type="rotate"
									values="0 12 12;360 12 12"
								/>
							</path>
						</svg>
					</span>
				{:else if completion == 'skipped' && completed}
					<span title="Skipped">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-full h-full"
							width="16"
							height="16"
							viewBox="0 0 16 16"
						>
							<path
								fill="currentColor"
								d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M4.79 5.093L8 7.386V5.5a.5.5 0 0 1 .79-.407l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 8 10.5V8.614l-3.21 2.293A.5.5 0 0 1 4 10.5v-5a.5.5 0 0 1 .79-.407"
							/>
						</svg>
					</span>
				{:else}
					<!--
					<span title="Not yet translated">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-full p-0.5 h-full stroke-stone-500 fill-stone-500"
							stroke-width="2"
							width="24"
							height="24"
							viewBox="0 0 24 24"
						>
							<path
								d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
							/>
						</svg>
					</span>
				-->
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
				class="rounded border-2 w-full flex {completed ? 'opacity-70' : '  '} {card.translate
					.complete}"
			>
				<div class="w-1/3 border-r-2 border-inherit px-2">
					{segment}
				</div>
				{#if skipped}
					<div class=" w-2/3 px-2 italic opacity-60">Translation Skipped</div>
				{:else if completed}
					<div class=" w-2/3 px-2">{translation}</div>
				{:else}
					<textarea
						placeholder="Translate segment here..."
						class="bg-white rounded-r dark:bg-black w-2/3 px-2 min-h-full"
						rows="1"
						bind:value={translation}
					></textarea>
				{/if}
			</div>

			<div class="w-6 p-0.5 h-5">
				<CommentViewer bind:completed bind:comment />
			</div>
		{/if}
	</div>
</div>
