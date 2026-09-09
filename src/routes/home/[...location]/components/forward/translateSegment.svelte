<script lang="ts">
	import { card } from '$lib/styles';
	import { typeLabels } from '$lib/types';
	import { quintInOut } from 'svelte/easing';
	import { draw, fade } from 'svelte/transition';

	import CommentViewer from '../commentViewer.svelte';
	import CompletionIndicator from '../completionIndicator.svelte';
	import type { Database } from '$lib/supabase/database.types';
	import { onMount } from 'svelte';

	let {
		completed,
		canEdit,
		editing,
		label,
		segment,
		saving,
		translation = $bindable(),
		open = $bindable(),
		comment = $bindable(),
		skipped = $bindable()
	}: {
		completed: boolean;
		canEdit: boolean;
		editing: boolean;
		label: Database['public']['Enums']['SegmentType'];
		segment: string;
		saving: boolean;
		translation: string;
		open: boolean;
		comment: string;
		skipped: boolean;
	} = $props();

	let interactable = $derived(!completed || (completed && editing));

	let inProgress: boolean = $derived(translation.trim().length > 0);
	let ogText: string = $state('');

	let _completion: 'inProgress' | 'forwardTranslated' | 'skipped' | 'toForwardTranslate' =
		$derived.by(() => {
			if (translation.length > 1) return 'inProgress';
			if (completed) return 'forwardTranslated';
			if (skipped) return 'skipped';
			return 'toForwardTranslate';
		});

	onMount(() => {
		ogText = translation;
	});
</script>

<div class=" md:ml-4">
	<div class="w-full flex justify-between">
		<div class="flex mr-7 w-full justify-between items-center">
			<div class="flex w-1/2">
				<!-- Open/Close Button -->
				<button
					class=" {!interactable ? ' opacity-50  ' : ''} 
					flex group bg-green-500/20 hover:bg-green-500/30 text-stone-600 rounded-md dark:text-stone-400 px-2 hover:underline cursor-pointer"
					onclick={() => {
						open = !open;
					}}
				>
					<div
						class="w-4 p-0.5 h-4 rounded-full
					  stroke-stone-500
					  dark:stroke-stone-400"
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

					<span class="text-sm font-semibold italic">Translate {typeLabels[label]}</span>
				</button>

				<!-- Completion Indicator -->
				<CompletionIndicator
					{editing}
					{completed}
					{inProgress}
					{skipped}
					{saving}
					completedText={'translated'}
				/>
			</div>

			<div class="flex h-6">
				<!-- Skip button -->
				{#if interactable && open}
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
				<!--Edit-->
				{#if canEdit && open}
					<button
						in:fade={{ duration: 100 }}
						title="Edit submitted translation"
						class=" ml-1 flex items-center pl-2.5 pr-1 rounded-t-md group border-2 border-b-0 text-sm border-stone-800 dark:border-stone-400 cursor-pointer
						 {editing
							? ' opacity-80 hover:opacity-100 text-stone-200 hover:text-stone-100 hover: bg-stone-800 dark:text-stone-950 dark:bg-stone-400'
							: 'text-stone-800 dark:text-stone-400  opacity-50 hover:opacity-100'} "
						onclick={() => {
							editing = !editing;
						}}
					>
						<span class="text-sm font-bold">Edit</span>

						<div class="w-5 px-0.5 text-inherit h-full">
							<svg
								class="w-full h-full"
								xmlns="http://www.w3.org/2000/svg"
								width="1024"
								height="1024"
								viewBox="0 0 1024 1024"
							>
								<path d="M0 0h1024v1024H0z" fill="none" />
								<path
									fill="currentColor"
									d="M880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32m-622.3-84c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9"
								/>
							</svg>
							<!--
							<svg
								class="w-full h-full"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
							>
								<path d="M0 0h24v24H0z" fill="none" />
								<path
									fill="currentColor"
									d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z"
								/>
							</svg>-->
						</div>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="flex w-full h-full transition-all {open ? ' max-h-300 duration-500 ' : 'max-h-0'}">
		{#if open}
			<div
				in:fade={{ duration: 200 }}
				class="rounded-md border-2 w-full z-4 flex flex-col {!interactable
					? 'opacity-70'
					: '  '} {!interactable ? card.translate.complete : card.translate.incomplete}"
			>
				<!--Original Segment-->
				<div class="w-full border-b-2 border-inherit px-2">
					{segment}
				</div>
				<!--Translation Area-->
				{#if skipped}
					<!-- skipped message -->
					<div class=" w-full px-2 italic opacity-60">Translation Skipped</div>
				{:else if !interactable}
					<!-- existing translation -->
					<div class=" w-full px-2">{ogText}</div>
				{:else}
					<!-- text input translation -->
					<textarea
						placeholder="Translate segment here..."
						class="bg-white z-20 rounded-b dark:bg-stone-800 w-full px-2 min-h-6"
						rows="1"
						bind:value={translation}
					></textarea>
				{/if}
			</div>

			<!--Comment button-->
			<div class="w-6 p-0.5 h-5">
				<CommentViewer completed={!interactable} bind:comment />
			</div>
		{/if}
	</div>
</div>
