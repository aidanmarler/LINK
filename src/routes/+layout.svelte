<script>
	import { pageSettings } from '$lib/pageSettings.svelte';
	let { children } = $props();
	import '../app.css';

	pageSettings.theme = 'dark';
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
