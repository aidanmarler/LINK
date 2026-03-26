<script lang="ts">
	import { button_green } from '$lib/styles';
	import ThemeManager from './components/themeManager.svelte';

	const buttonStyle =
		'w-full max-w-80 text-xl m-auto block text-center rounded-xl cursor-pointer mb-2 p-0.5 border-2 hover:bg-stone-50 border-stone-500 dark:hover:bg-stone-900 dark:hover:border-stone-300 hover:border-stone-600';
</script>

<div class="p-5">
	<div class="mx-auto w-full text-center mt-15">
		<div class="mx-auto w-full justify-center flex">
			<img alt="LINK icon" class="dark:invert-0 invert w-22 mt-1 opacity-80" src="/link.svg" />
			<h1 class="font-bold text-8xl">LINK</h1>
		</div>
		<h4 class="italic mb-15 mt-3 text-xl">Language Integration Network Kit</h4>
	</div>
	<div class=" rounded-lg w-full mt-10 max-w-2xl mx-auto">
		<div class="flex-wrap px-4">
			<p class="text-2xl font-semibold mb-2 text-center">
				Do you have native or bilingual fluency in Spanish, French, or Portuguese?
			</p>
			<p class="font-normal text-lg italic text-center">
				Help translate ISARIC's ARC database of CRF questions so that our Bridge is more accessible
				to researchers and clinitians around the world
			</p>
		</div>
	</div>
	<div class="w-full max-w-96 my-auto mx-auto">
		<div class="flex-wrap border-inherit p-4">
			<p class="font-bold text-stone-700 dark:text-stone-300 w-full text-center mt-15"></p>
			<a
				data-sveltekit-preload-code="eager"
				class="w-full block max-w-80 m-auto text-3xl font-semibold rounded-xl border-2 cursor-pointer p-1 text-center {button_green}"
				href="/login"
			>
				Login
			</a>
			<p class="font-bold text-stone-700 dark:text-stone-300 w-full text-center mt-3"></p>
			<a data-sveltekit-preload-code="eager" class="{buttonStyle} text-md" href="/register">
				Create Account
			</a>
		</div>
	</div>

	<div class="w-full flex justify-center mt-20"><ThemeManager /></div>
</div>
