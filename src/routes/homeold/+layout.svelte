<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../../supabaseClient';
	import type { AuthSession } from '@supabase/supabase-js';
	import type { Profile, TranslationLanguage } from '$lib/types';
	import { getProfile } from '$lib/supabase/auth';
	import { updateGlobalTables, userProfile } from '$lib/global.svelte';
	import { page } from '$app/state';
	import { scale } from 'svelte/transition';
	import { makeFolderLabel } from '$lib/utils/utils';
	import KabobMenu from '../components/kabobMenu.svelte';

	let { children } = $props();

	let session: AuthSession | null = $state(null);
	onMount(() => {
		supabase.auth.getSession().then(async ({ data }) => {
			session = data.session;
			if (session == null) {
				window.location.href = '../login';
			}
			// Set profile data
			userProfile.user = (await getProfile(session)) satisfies Profile | null;
			if (!userProfile.user) return;
			updateGlobalTables(userProfile.user.language as TranslationLanguage);
		});

		supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
			if (session == null) {
				userProfile.user = null;
				window.location.href = '../login';
			}
		});
	});

	let pathSegments = $derived(page.url.pathname.split('/').filter(Boolean));

	let breadCrumbs = $derived(
		pathSegments.map((segment, index) => {
			return {
				name: segment == 'arc' ? 'ARC' : makeFolderLabel(segment),
				href: '/' + pathSegments.slice(0, index + 1).join('/')
			};
		})
	);
</script>

{#if session}
	<div class="w-full p-4 md:max-w-4xl md:mx-auto">
		<div in:scale={{ duration: 500, opacity: 0 }} class="w-full flex h-10 justify-between">
			<div class="text-lg pt-1 font-medium flex">
				{#each breadCrumbs as crumb, i (crumb)}
					<a
						data-sveltekit-preload-code="eager"
						class="cursor-pointer hover:underline mr-1"
						href={crumb.href}
					>
						{crumb.name}
					</a>
					{#if i < breadCrumbs.length - 1}
						<span> >&nbsp</span>
					{/if}
				{/each}
			</div>

			<div class="h-50">
				<KabobMenu />
			</div>
		</div>
		<hr
			in:scale={{ duration: 500, opacity: 0 }}
			class="dark:text-stone-600 text-stone-700 mt-1 mb-5"
		/>
		{@render children()}
	</div>
{/if}
