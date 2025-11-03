<script lang="ts">
	import { page } from '$app/state';
	import { addressBook, loadedStatus } from '$lib/global.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { card_dynamic } from '$lib/styles';

	let form = $state('');
	onMount(() => {
		form = page.url.pathname.split('/').filter(Boolean)[2];
		console.log('form', form, page.url.pathname.split('/').filter(Boolean));
	});
</script>

{#if loadedStatus.arc && addressBook.forms[form]?.sections}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
	>
		<h1>Labels</h1>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<a
				data-sveltekit-preload-code="eager"
				class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col rounded-md text-center {card_dynamic}"
				href="{page.url.pathname}/labels"
			>
				<h3 class="text-xl mb-2">{addressBook.forms[form].branch.id_label} Labels</h3>
			</a>
		</div>
		<br />
		<h1>Sections</h1>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{#each Object.entries(addressBook.forms[form].sections) as [section], i (section)}
				<a
					data-sveltekit-preload-code="eager"
					class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col rounded-md text-center {card_dynamic}"
					href="{page.url.pathname}/{addressBook.forms[form].sections[section].branch.id_nav}"
				>
					<h3 class="text-xl mb-2">{addressBook.forms[form].sections[section].branch.id_label}</h3>
				</a>
			{/each}
		</div>
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
