<script lang="ts">
	import { fly } from 'svelte/transition';
	import { loading } from './loadingState.svelte';
</script>

<div
	transition:fly={{ x: 10, duration: 100 }}
	class="flex z-20 top-10 w-60 right-0 fixed border p-1 font-semibold -translate-x-30 shadow h-auto rounded-full cursor-progress text-lg
            dark:bg-stone-950 dark:border-stone-600 bg-stone-200 border-stone-700 dark:shadow-black shadow-stone-400"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="w-6.5 h-full mx-1 p-0.5 stroke-stone-700 fill-stone-700 dark:fill-stone-500 dark:stroke-stone-500"
		width="24"
		height="24"
		viewBox="0 0 24 24"
	>
		<path
			d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"
		>
			<animateTransform
				attributeName="transform"
				dur="2s"
				repeatCount="indefinite"
				type="rotate"
				values="0 12 12;360 12 12"
			/>
		</path>
	</svg>
	{loading.message}
</div>
