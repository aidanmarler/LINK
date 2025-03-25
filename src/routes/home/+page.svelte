<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../../supabaseClient';
	import type { AuthSession } from '@supabase/supabase-js';

	let session: AuthSession | null;

	onMount(() => {
		supabase.auth.getSession().then(({ data }) => {
			session = data.session;
			console.log(session);
			if (session == null) {
				window.location.href = '../';
			}
		});

		supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
			if (session == null) {
				window.location.href = '../';
			}
		});
	});
</script>

{#if session}
	<h1>home</h1>
	<h2>{session.user.email}</h2>
	<button class="bg-amber-500" onclick={() => supabase.auth.signOut()}> Logout </button>
{/if}
