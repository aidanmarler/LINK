<script>
	let { children } = $props();
	import '../app.css';
</script>

{@render children()}

<style lang="postcss">
	@reference "tailwindcss/theme";
	:global(body) {
		@apply bg-stone-950;
        @apply text-white;
        @apply font-extralight;
        
	}
</style>
