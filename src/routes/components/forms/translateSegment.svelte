<script lang="ts">
	import { page } from '$app/state';
	import { formTableTree } from '$lib/global.svelte';
	import { card_static } from '$lib/styles';
	import type { SegmentData } from '$lib/types';

	let { segment, translation = $bindable() }: { segment: string; translation: string } = $props();
</script>

<div class={'rounded w-full flex mb-2 ' + card_static}>
	<div class="w-1/3 px-2">
		{segment}
	</div>
	<input class=" bg-white border-2 border-stone-800 w-2/3 px-2" type="text" bind:value={translation} />
	<div>
		<button class=" cursor-pointer w-5"> : </button>
	</div>
</div>
