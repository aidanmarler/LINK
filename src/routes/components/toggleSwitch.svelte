<script lang="ts">
	let { label = '', value = $bindable() }: { label?: string; value: boolean } = $props();
</script>

<!-- Full element -->
<label
	class="flex items-center hover:underline cursor-pointer p-0.5 px-1 rounded-full {value
		? 'opacity-100  border-stone-700 dark:border-stone-600 '
		: 'opacity-50 hover:opacity-80 border-transparent'}"
	title="{value ? 'Hide' : 'Show'}"
>
	<div class="relative">
		<!-- Invisible Checkbox -->
		<input type="checkbox" class="sr-only" bind:checked={value} />
		<!-- Background -->
		<div
			class="block w-9 h-5 rounded-full border-2 ease-in-out {value
				? 'bg-stone-100 dark:bg-stone-800 dark:border-stone-200 '
				: ''}"
		></div>
		<!--Slider-->
		<div
			class="absolute border-2 left-1 top-1 w-3 h-3 rounded-full transition-transform duration-75 ease-in-out {value
				? 'transform translate-x-4 bg-black dark:bg-stone-200 dark:border-stone-200'
				: ''}"
		></div>
	</div>
	{#if label !== ''}
		<span class="mx-1">
			{label}
		</span>
	{/if}
</label>
