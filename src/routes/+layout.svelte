<script lang="ts">
	import '../app.css';
	import Footer from './components/footer.svelte';

	let { children } = $props();
</script>

<span
	class="font-normal border-stone-600 dark:border-stone-600 bg-stone-200 dark:bg-stone-950 text-stone-950 dark:text-stone-100"
>
	<!-- Main content -->
	<main class="min-h-[90vh] flex-grow">
		{@render children()}
	</main>

	<Footer />
</span>
