<script lang="ts">
	import type { LocationCompletion } from '$lib/utils/locationTree';
	import { fade } from 'svelte/transition';
	type Options = {
		showKey?: boolean;
		large?: boolean;
	};
	let { completion, options }: { completion: LocationCompletion; options: Options } = $props();
	let total = $derived.by(() => {
		return Object.values(completion).reduce((sum, current) => sum + current, 0);
	});
	let complete = $derived.by(() => {
		let sum = 0;
		for (const key of Object.keys(completion)) {
			if (['forwardComplete', 'reviewComplete', 'backwardComplete'].includes(key)) {
				sum += completion[key as keyof LocationCompletion];
			}
		}
		return sum;
	});

	// Helper to determine rounding classes
	function getRoundingClass(index: number, totalActive: number): string {
		if (totalActive === 1) return 'rounded-sm';
		if (index === 0) return 'rounded-l-sm';
		if (index === totalActive - 1) return 'rounded-r-sm';
		return '';
	}

	// Category configuration
	const categories = [
		{
			key: 'forwardComplete' as keyof LocationCompletion,
			label: 'Forward Complete',
			bgClass: 'bg-green-700 dark:bg-green-500',
			opacity: 'opacity-80'
		},
		{
			key: 'reviewComplete' as keyof LocationCompletion,
			label: 'Review Complete',
			bgClass: 'bg-green-700 dark:bg-green-500',
			opacity: 'opacity-80'
		},
		{
			key: 'backwardComplete' as keyof LocationCompletion,
			label: 'Backward Complete',
			bgClass: 'bg-green-700 dark:bg-green-500',
			opacity: 'opacity-80'
		},
		{
			key: 'forwardNeeded' as keyof LocationCompletion,
			label: 'Forward Needed',
			bgClass: 'bg-pink-900/40 dark:bg-pink-700/30',
			opacity: 'opacity-70'
		},
		{
			key: 'reviewNeeded' as keyof LocationCompletion,
			label: 'Review Needed',
			bgClass: 'bg-pink-900/40 dark:bg-pink-700/30',
			opacity: 'opacity-70'
		},
		{
			key: 'backwardNeeded' as keyof LocationCompletion,
			label: 'Backward Needed',
			bgClass: 'bg-pink-900/40 dark:bg-pink-700/30',
			opacity: 'opacity-70'
		}
	];

	// Filter to only categories with values > 0
	let activeCategories = $derived(categories.filter((cat) => completion[cat.key] > 0));
</script>

<div class="w-full m-auto h-full">
	<div class="flex my-0.5 {options.large ? 'h-4' : 'h-2'} w-full">
		{#each activeCategories as category, i}
			<div
				class="{category.bgClass} {category.opacity} {getRoundingClass(i, activeCategories.length)}"
				style="width: {(completion[category.key] / total) * 100}%;"
			></div>
		{/each}
	</div>

	{#if options.showKey}
		<div class="flex justify-center w-full p-1 flex-wrap {options.large ? 'text-md' : 'text-xs'} font-normal">
			{#if complete > 0}
				<div class=" mx-0.5 flex flex-row rounded-md">
					<div
						class=" bg-green-700/80 dark:bg-green-500/80 rounded-md {options.large
							? 'mt-1 h-3 w-3'
							: 'h-2 w-2'}"
					></div>
					<p class="-mt-1 px-1">{complete} Complete</p>
				</div>
			{/if}
			{#if total - complete > 0}
				<div class="mx-0.5 flex flex-row rounded-md">
					<div
						class="bg-pink-900/40 dark:bg-pink-700/30 rounded-md {options.large
							? 'mt-1 h-3 w-3'
							: 'h-2 w-2'}"
					></div>
					<p class="-mt-1 px-1">{total - complete} Incomplete</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
