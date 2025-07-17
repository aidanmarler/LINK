<script>
	import { pageSettings } from '$lib/pageSettings.svelte';
	import { onMount } from 'svelte';
	let { children } = $props();
	import '../app.css';

	pageSettings.theme = 'dark';

	let isDark = $state(true);

	// Initialize based on user preference or system preference
	const initialTheme = onMount(() => {
		if (typeof window !== 'undefined') {
			const theme = localStorage.getItem('theme');
			if (theme === 'true') {
				isDark = true;
			} else if (theme === 'false') {
				isDark = false;
			} else {
				isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			}
		} else {
			isDark = true;
		}

		document.documentElement.classList.toggle('dark', isDark);
	});
</script>

{@render children()}

<!--
<style lang="postcss">
	@reference "tailwindcss/theme";

	:global(body) {
		@apply bg-stone-100 text-stone-900 text-white;
		@apply font-extralight;
		@apply dark:bg-stone-950 dark:text-white;
	}
</style>
-->
