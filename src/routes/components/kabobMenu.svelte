<script lang="ts">
	import { userProfile } from '$lib/global.svelte';
	import { fly, scale } from 'svelte/transition';
	import { supabase } from '../../supabaseClient';

	let menuContainer: HTMLDivElement;
	let menuOpen = $state(false);
	let isDark = $state(document.documentElement.classList.contains('dark'));

	const buttonStyle =
		'h-7 flex justify-left cursor-pointer hover:bg-white dark:hover:bg-stone-800 rounded-md opacity-70 hover:opacity-100';

	// Handle clicks outside the menu
	function handleClickOutside(event: MouseEvent) {
		if (menuContainer && !menuContainer.contains(event.target as Node)) {
			menuOpen = false;
		}
	}

	// Add/remove event listener when menu opens/closes
	$effect(() => {
		if (menuOpen) {
			// Add listener on next tick to avoid immediate closure
			setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 0);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}

		// Cleanup function
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div bind:this={menuContainer}>
	<button
		onclick={() => {
			menuOpen = !menuOpen;
		}}
		class="opacity-70 hover:opacity-100 h-full translate-x-2 translate-y-1 cursor-pointer"
		title="Menu"><img alt="Menu" class="dark:invert h-8" src="/interaction/kabob.svg" /></button
	>
	{#if menuOpen}
		<div
			transition:fly={{ x: 15, duration: 75 }}
			class="flex z-10 flex-col font-semibold text-sm overflow-hidden border shadow w-44 h-auto absolute -translate-x-36 -translate-y-1 rounded-lg
            dark:bg-stone-950 dark:border-stone-600 bg-stone-200 border-stone-700 dark:shadow-black shadow-stone-400"
		>
			<div class="border-b border-inherit p-1 space-y-0.5 flex flex-col">
				<button
					class={buttonStyle}
					title={isDark ? 'Light Theme' : 'Dark Theme'}
					onclick={() => {
						isDark = !$state.snapshot(isDark);
						document.documentElement.classList.toggle('dark', isDark);
					}}
				>
					{#if isDark}
						<img class="dark:invert w-9 p-1 duration-200" alt="Menu" src="/interaction/sun.svg" />
					{:else}
						<img class="dark:invert w-9 p-1 duration-200" alt="Menu" src="/interaction/moon.svg" />
					{/if}

					<div class="h-full pt-1">{isDark ? 'Light Theme' : 'Dark Theme'}</div>
				</button>
				<button
					class={buttonStyle}
					title="Logout"
					onclick={() => {
						userProfile.user = null;
						supabase.auth.signOut();
					}}
				>
					<img class="dark:invert w-9 p-1" alt="Menu" src="/interaction/logout.svg" />
					<div class="h-full pt-1">Logout</div>
				</button>
			</div>
			<div class=" p-1 space-y-0.5 flex flex-col">
				<select class="{buttonStyle} pl-2"
					>CRF: <option>Dengue</option><option>All Questions</option><option>All Questions</option
					></select
				>
			</div>
		</div>
	{/if}
</div>
