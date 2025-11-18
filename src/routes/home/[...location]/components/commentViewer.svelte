<script lang="ts">
	import { fly } from 'svelte/transition';

	let {
		completed = $bindable(),
		comment = $bindable()
	}: {
		completed: boolean;
		comment: string | null;
	} = $props();

	let menuContainer: HTMLDivElement;
	let menuOpen = $state(false);

	const buttonStyle =
		'h-7 flex justify-left cursor-pointer hover:bg-white dark:hover:bg-stone-800 rounded-md opacity-70 hover:opacity-100';

	const textStyle = ' min-h-7 flex bg-stone-50 p-0.5 px-2 dark:bg-stone-800 rounded-md ';
	const completeStyle = ' min-h-7 flex bg-stone-200 p-0.5 px-2 dark:bg-stone-950 rounded-md ';

	// Handle clicks outside the menu
	function handleClickOutside(event: MouseEvent) {
		if (menuContainer && !menuContainer.contains(event.target as Node)) {
			menuOpen = false;
		}
	}
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
			menuOpen = false;
		}
	}

	// Add/remove event listener when menu opens/closes
	$effect(() => {
		if (menuOpen) {
			// Add listener on next tick to avoid immediate closure
			setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
				document.addEventListener('keydown', handleKeydown);
			}, 0);
		} else {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		}

		// Cleanup function
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div bind:this={menuContainer}>
	{#if completed}
		<button
			onclick={() => {
				menuOpen = !menuOpen;
			}}
			class="opacity-60 hover:bg-stone-50 -translate-y-1.5 rounded-full t-0 p-1 hover:opacity-100 w-8 h-8 cursor-pointer"
			title="See comment"
			><img
				alt="See comment"
				class="dark:invert h-full w-full"
				src="/interaction/comment.svg"
			/></button
		>
	{:else}
		<button
			onclick={() => {
				menuOpen = !menuOpen;
			}}
			class="opacity-60 hover:bg-stone-50 -translate-y-1.5 rounded-full t-0 p-1 hover:opacity-100 w-8 h-8 cursor-pointer"
			title="Add a comment"
			><img
				alt="Add comment"
				class="dark:invert h-full w-full"
				src="/interaction/addComment.svg"
			/></button
		>
	{/if}
	{#if menuOpen}
		<div
			transition:fly={{ x: 15, duration: 75 }}
			class="flex z-10 flex-col font-semibold text-sm overflow-hidden border shadow w-100 h-auto absolute -translate-x-94 -translate-y-1.5 rounded-lg
            dark:bg-stone-950 dark:border-stone-600 bg-stone-200 border-stone-700 dark:shadow-black shadow-stone-400"
		>
			<!--
			<div class="border-inherit border-b p-1 flex flex-col">
				

				<button
					class={buttonStyle}
					title="Choose not to translate segment."
					onclick={() => {
						console.log('skip!', skipped);
						skipped = !skipped;
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class=" h-full dark:invert w-9 p-1.5"
						width="16"
						height="16"
						viewBox="0 0 16 16"
					>
						<path
							d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M4.79 5.093L8 7.386V5.5a.5.5 0 0 1 .79-.407l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 8 10.5V8.614l-3.21 2.293A.5.5 0 0 1 4 10.5v-5a.5.5 0 0 1 .79-.407"
						/>
					</svg>
					<div class="h-full pt-1">Skip</div>
				</button>
				
				<button
					class={buttonStyle}
					title="Write a comment for reviewers/admins."
					onclick={() => {
						commentOpen = !commentOpen;
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="dark:invert w-9 h-full p-1"
						width="24"
						height="24"
						viewBox="0 0 24 24"
					>
						<path
							d="m6 18l-2.3 2.3q-.475.475-1.088.213T2 19.575V4q0-.825.588-1.412T4 2h16q.825 0 1.413.588T22 4v12q0 .825-.587 1.413T20 18zm5-7v2q0 .425.288.713T12 14t.713-.288T13 13v-2h2q.425 0 .713-.288T16 10t-.288-.712T15 9h-2V7q0-.425-.288-.712T12 6t-.712.288T11 7v2H9q-.425 0-.712.288T8 10t.288.713T9 11z"
						/>
					</svg>
					<div class="h-full pt-1">Write Comment</div>
				</button>
			</div>
		-->
			<div class=" p-1 flex flex-col">
				{#if completed == true && comment == ''}
					<p class="{completeStyle} italic opac">No comment provided</p>
				{:else if completed == true}
					<p class={completeStyle}>{comment}</p>
				{:else}
					<textarea placeholder="Leave comment here..." class={textStyle} bind:value={comment}
					></textarea>
				{/if}
			</div>
		</div>
	{/if}
</div>
