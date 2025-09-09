<script lang="ts">
	import { page } from '$app/state';
	import {
		address,
		addressBook,
		formTableTree,
		global_address,
		loadedStatus,
		reset_address
	} from '$lib/global.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { card_dynamic } from '$lib/styles';
	import { capitalizeFirstLetter } from '$lib/utils/utils';

	onMount(() => {
		console.log('form', page.url.pathname.split('/').filter(Boolean));
	});
</script>

{#if loadedStatus.arc}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
		class="grid grid-cols-1 sm:grid-cols-2 gap-3"
	>
		{#each Object.entries(addressBook.forms) as [form], i (form)}
			<a
				data-sveltekit-preload-code="eager"
				class="min-w-1/2 bg-center object-center items-center p-3 flex flex-col rounded-md text-center {card_dynamic}"
				href="{page.url.pathname}/{addressBook.forms[form].branch.id_nav}"
			>
				<h3 class="text-xl mb-2">{addressBook.forms[form].branch.id_label}</h3>
			</a>
		{/each}
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
