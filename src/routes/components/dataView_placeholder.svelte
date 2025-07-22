<script lang="ts">
	import type { CompletionReport } from '$lib/types';
	import { fade } from 'svelte/transition';
	type Options = {
		showKey?: boolean;
		large?: boolean;
	};

	let { options }: { options: Options } = $props();
</script>

<div class="w-full p-1 h-auto">
	<div class="flex w-auto {options.large ? 'h-4' : 'h-1.5'}">
		<div class="bg-stone-200 dark:bg-stone-800 opacity-0 rounded-sm" style="width: 100%;"></div>
	</div>
</div>

{#if options.showKey}
	<div
		class="flex flex-wrap justify-center {options.large == true
			? 'text-md'
			: 'text-xs'} font-normal"
	>
		<div class="justify-center mx-0.5 flex flex-row p-1 rounded-md">
			<div
				class="bg-stone-300 dark:bg-stone-800 rounded-md opacity-90 {options.large
					? ' mt-1 h-3 w-3 '
					: ' h-2 w-2 '}"
			></div>
			<p class="-mt-1 px-1">...</p>
		</div>
	</div>
{/if}
