<script lang="ts">
	import type { AuthSession } from '@supabase/supabase-js';
	import { page } from '$app/state';
	import { scale } from 'svelte/transition';
	import { makeFolderLabel } from '$lib/utils/utils';
	import KabobMenu from '../components/kabobMenu.svelte';
	import type { derived } from 'svelte/store';

	let { children, data } = $props();

	let profile = $derived(data.profile);

	// Data loads progressively
	let isLoading = $state(true);
	let loadingError = $state<string | null>(null);

	// Get nav working
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

{#if profile}
	<div in:scale|={{ duration: 500, opacity: 0 }} class="w-full p-4 md:max-w-4xl md:mx-auto">
		<div class="w-full flex h-10 justify-between">
			<nav class="text-lg pt-1 font-medium flex">
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
			</nav>

			<div class="h-50">
				<KabobMenu />
			</div>
		</div>
		<hr class="dark:text-stone-600 text-stone-700 mt-1 mb-5" />
		{@render children()}
	</div>
{/if}
