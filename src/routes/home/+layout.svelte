<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../../supabaseClient';
	import type { AuthSession } from '@supabase/supabase-js';
	import type { Profile, TranslationLanguage } from '$lib/types';
	import { getProfile, retrieveTable_lists } from '$lib/supabase/supabaseHelpers';
	import {
		global_address,
		reset_address,
		updateGlobalTables,
		userProfile
	} from '$lib/global.svelte';

	import { page } from '$app/state';
	import Logout from '../components/logout.svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { capitalizeFirstLetter } from '$lib/utils';

	let { children } = $props();

	let session: AuthSession | null = $state(null);
	onMount(() => {
		supabase.auth.getSession().then(async ({ data }) => {
			session = data.session;
			if (session == null) {
				window.location.href = '../';
			}
			// Set profile data
			userProfile.user = (await getProfile(session)) as Profile | null;
			console.log('updateGlobalTables');
			updateGlobalTables(userProfile.user?.language as TranslationLanguage);
		});

		supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
			if (session == null) {
				userProfile.user = null;
				window.location.href = '../';
			}
		});
	});

	let pathSegments = $derived(page.url.pathname.split('/').filter(Boolean));

	let breadCrumbs = $derived(
		pathSegments.map((segment, index) => {
			return {
				name: capitalizeFirstLetter(segment.replaceAll('%20', ' ')),
				href: '/' + pathSegments.slice(0, index + 1).join('/')
			};
		})
	);
</script>

{#if session}
	<div class="w-full p-4 md:max-w-3xl md:mx-auto">
		<div in:scale={{ duration: 500, opacity: 0 }} class="w-full pb-2 pt-2 flex justify-between">
			<div class="text-lg font-medium">
				{#each breadCrumbs as crumb, i (crumb)}
					<a
						data-sveltekit-preload-code="eager"
						class="cursor-pointer hover:underline"
						href={crumb.href}>{crumb.name}</a
					>
					{#if i < breadCrumbs.length - 1}
						<span> >&nbsp</span>
					{/if}
				{/each}
			</div>
			<div>
				<select
					class="mr-2 h-full bg-blue-900/50 border-2 border-blue-600/50 px-3 py-0.5 font-semibold rounded-md cursor-pointer
						hover:bg-blue-900 hover:border-blue-600"
					>CRF: <option>Dengue</option><option>All Questions</option><option>All Questions</option
					></select
				>
				<Logout />
			</div>
		</div>
		<hr in:scale={{ duration: 500, opacity: 0 }} class="text-stone-500 mb-5" />
		{@render children()}
	</div>
{/if}
