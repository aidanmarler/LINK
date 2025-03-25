<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../../supabaseClient';
	import type { AuthSession } from '@supabase/supabase-js';
	import RetrieveArc from './components/retrieve_ARC.svelte';
	import CheckVersions from './components/check_versions.svelte';
	import { checkAdminStatus } from '$lib/supabaseHelpers';

	let session: AuthSession | null;
	let isAdmin: boolean = false;

	onMount(async () => {
		const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
		session = sessionData.session;

		if (sessionError || !session) {
			window.location.href = '/';
			return;
		}

		isAdmin = await checkAdminStatus(session.user.id);

		if (!isAdmin && window.location.pathname === '/admin') {
			window.location.href = '/404';
		}

		supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
			if (!session) {
				window.location.href = '/';
			} else {
				checkAdminStatus(session.user.id).then((adminStatus) => {
					isAdmin = adminStatus;
					if (!isAdmin && window.location.pathname === '/admin') {
						window.location.href = '/404';
					}
				});
			}
		});
	});
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

{#if session && isAdmin}
	<div class="w-full p-4 md:p-0 md:max-w-2xl md:mx-auto">
		<h1 class="text-3xl my-3 font-bold">Admin</h1>
		<div class=" px-2 w-full flex justify-between items-center">
			<h2>{session.user.email}</h2>
			<button
				class="bg-amber-700 block right-0 w-full md:w-auto font-bold hover:bg-amber-600 p-0.5 px-2 cursor-pointer"
				onclick={() => supabase.auth.signOut()}
			>
				Logout
			</button>
		</div>

		<div class="w-full bg-amber-50 h-0.5 my-3"></div>

		<CheckVersions />
	</div>
{/if}
