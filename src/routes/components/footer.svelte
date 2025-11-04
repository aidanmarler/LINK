<script lang="ts">
	import { button_A_active } from "$lib/styles";

	const footerTextStyle = ' text-stone-600 dark:text-stone-400 ';
	const footerHeaderStyle = ' italic text-sm ';
	const footerLinkStyle = ' hover:underline hover:text-stone-800 dark:hover:text-stone-200 ';
</script>

<footer class="w-full flex max-w-40 m-auto flex-col text-center {footerTextStyle} my-[100px]">
	<span class={footerHeaderStyle}>Brought to you by</span>
	<a target="_blank" class="{button_A_active} " href="https://www.contagio.network/">CONTAGIO</a>
	<a target="_blank" class={button_A_active} href="https://isaric.org/">ISARIC</a>
	<div class="h-5"></div>

	<span class={footerHeaderStyle}>Source Code</span>
	<a target="_blank" class={button_A_active} href="https://github.com/ISARICResearch/LINK">GitHub</a
	>

	<div class="h-5"></div>

	<span class={footerHeaderStyle}>Funders</span>
	<a target="_blank" class={button_A_active} href="https://commission.europa.eu/index_en">EU</a>
	<a target="_blank" class={button_A_active} href="https://www.who.int/">WHO</a>
</footer>
