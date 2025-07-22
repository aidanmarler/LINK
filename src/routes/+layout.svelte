<script lang="ts">
	import '../app.css';
	import Footer from './components/footer.svelte';

	let { children } = $props();
</script>

<!-- Main content -->
<main class="min-h-[90vh] flex-grow">
	{@render children()}
</main>

<Footer />
