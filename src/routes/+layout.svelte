<script lang="ts">
	import '../app.css';
	import Footer from './components/footer.svelte';

	import { supabase } from '../supabaseClient';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Session } from '@supabase/supabase-js';
	import { loading } from './components/loading/loadingState.svelte';
	import LoadingModal from './components/loading/loadingModal.svelte';

	let { children } = $props();

	let currentSession: Session | null = null;

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			console.log(event);

			if (event === 'INITIAL_SESSION') {
				currentSession = session;
				return;
			}

			const sessionChanged =
				session?.user?.id !== currentSession?.user?.id ||
				session?.access_token !== currentSession?.access_token;

			currentSession = session;

			if (sessionChanged) invalidateAll();
		});
		return () => subscription.unsubscribe();
	});
</script>

<span
	class="font-normal border-stone-600 dark:border-stone-600 bg-stone-200 dark:bg-stone-950 text-stone-950 dark:text-stone-100"
>
	<div class="w-full px-4 bg-amber-300 md:max-w-4xl md:mx-auto">
		{#if loading.active}
			<LoadingModal />
		{/if}
	</div>

	<!-- Main content -->
	<main class="min-h-[90vh] grow">
		{@render children()}
	</main>

	<Footer />
</span>
