<script lang="ts">
	import { button_A_active } from '$lib/styles';

	const footerTextStyle = ' text-stone-600 dark:text-stone-400 text-lg ';
	const footerHeaderStyle = ' italic text-sm ';
	//const footerLinkStyle = ' hover:underline hover:text-stone-800 dark:hover:text-stone-200 ';
</script>

<footer class="w-full flex max-w-90 m-auto flex-col text-center {footerTextStyle} my-25">
	<span class={footerHeaderStyle}>Brought to you by</span>
	<a target="_blank" title="CONTAGIO" class="{button_A_active} mx-auto px-10" href="https://www.contagio.network/"
		>CONTAGIO</a
	>
	<a target="_blank" title="ISARIC" class="{button_A_active} mx-auto px-10" href="https://isaric.org/">ISARIC</a>

	<p>
		CONTAGIO is funded by the European Union’s Horizon Europe programme under Grant Agreement N.
		101137283
	</p>

	<div class="h-5"></div>

	<span class={footerHeaderStyle}>Funders</span>
	<a
		title="European Commission"
		target="_blank"
		class="{button_A_active} mx-auto px-10"
		href="https://commission.europa.eu/index_en">EC</a
	>
	<a title="WHO" target="_blank" class="{button_A_active} mx-auto px-10" href="https://www.who.int/">WHO</a>

	<div class="h-5"></div>

	<span class={footerHeaderStyle}>Source Code</span>
	<a
		target="_blank"
		title="Github"
		class="mx-auto px-10 {button_A_active}"
		href="https://github.com/ISARICResearch/LINK">GitHub</a
	>

	<p class="mt-5 text-md inline-block">
		Have you encountered a bug, issue, or error? <a
		title="Issue Report Form"
			target="_blank"
			class="hover:underline {button_A_active} not-italic p-1 px-3 font-semibold mb-5"
			href="https://www.contagio.network/"
		>
			Report it here.</a
		>
	</p>
</footer>
