<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../../supabaseClient';
	import type { AuthSession } from '@supabase/supabase-js';
	import { checkAdminStatus } from '$lib/supabase/supabaseHelpers';
	import Logout from '../components/logout.svelte';
	import ThemeManager from '../components/themeManager.svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import KabobMenu from '../components/kabobMenu.svelte';

	let { children } = $props();

	let session: AuthSession | null = $state(null);
	let isAdmin: boolean = $state(false);

	async function handleSessionCheck() {
		const { data, error } = await supabase.auth.getSession();
		session = data.session;

		if (error || !session) {
			window.location.href = '/';
			return;
		}

		isAdmin = await checkAdminStatus(session.user.id);
		if (!isAdmin && window.location.pathname === '/admin') {
			window.location.href = '/404';
		}
	}

	onMount(() => {
		handleSessionCheck();

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
</script>

{#if session && isAdmin}
	<div class="w-full p-4 max-w-3xl md:mx-auto">
		<div in:scale={{ duration: 500, opacity: 0 }} class="w-full flex h-10 justify-between">
			<div class="text-xl pt-2 cursor-default font-medium">Admin</div>
			<KabobMenu />
		</div>
		<hr in:scale={{ duration: 500, opacity: 0 }} class="text-stone-700 mt-1 mb-5" />
		{@render children()}
	</div>
{/if}
