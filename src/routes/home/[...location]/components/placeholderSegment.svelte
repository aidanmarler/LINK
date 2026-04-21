<script lang="ts">
	import { card } from "$lib/styles";
	import type { Database } from "$lib/supabase/database.types";
	import { typeLabels } from "$lib/types";
	import { quintInOut } from "svelte/easing";
	import { draw, fade } from "svelte/transition";

	let {
		label,
		segment,
		open = $bindable()
	}: {
		label: Database['public']['Enums']['SegmentType'];
		segment: string;
		open: boolean;
	} = $props();
</script>


<div class=" md:ml-4">
	<div class="w-full flex justify-between">
		<div class="flex mr-7 w-full justify-between items-center">
			<div class="flex w-1/3">
				<!-- Open/Close Button -->
				<button
					class=" flex group hover:underline cursor-pointer"
					onclick={() => {
						open = !open;
					}}
				>
					<div
						class="w-4 p-0.5 h-4 rounded-full
					group-hover:bg-white group-hover:fill-stone-600 group-hover:stroke-stone-600 stroke-stone-500
					dark:group-hover:bg-stone-800 dark:group-hover:fill-stone-400 dark:group-hover:stroke-stone-400 dark:stroke-stone-300"
					>
						{#if open}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class=" h-full w-full"
								width="24"
								height="24"
								viewBox="0 0 24 24"
							>
								<path
									in:draw={{ duration: 200, easing: quintInOut }}
									fill="none"
									stroke-width="4"
									stroke-linecap="round"
									d="M19 12.998H5v"
								/>
							</svg>{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class=" h-full w-full"
								width="24"
								height="24"
								viewBox="0 0 24 24"
							>
								<path
									in:draw={{ duration: 100, easing: quintInOut }}
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"
								/>
							</svg>{/if}
					</div>

					<span class="text-sm font-semibold italic text-stone-600">{typeLabels[label]}</span>
				</button>
			</div>
		</div>
	</div>

	<div class="flex w-full h-full transition-all {open ? ' max-h-300 duration-500 ' : 'max-h-0'}">
		{#if open}
			<div
				in:fade={{ duration: 200 }}
				class="rounded-md border-2 w-full flex opacity-70 {card.translate.incomplete}"
			>
				<!--Original Segment-->
				<div class="w-full border-inherit px-2">
					{segment}
				</div>
			</div>
		{/if}
	</div>
</div>
