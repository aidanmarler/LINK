<script lang="ts">
	import '../app.css';
	import Footer from './components/footer.svelte';

	let { children } = $props();
</script>

<span
	class="bg-blue-400 text-blue-700 font-normal border-stone-600 dark:text-green-300 dark:bg-green-950"
>
	<!-- Main content -->
	<main class="min-h-[90vh] flex-grow">
		{@render children()}
	</main>

	<Footer />
</span>
