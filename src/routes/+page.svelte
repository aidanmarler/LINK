<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../supabaseClient';
	import type { AuthSession, User, WeakPassword } from '@supabase/supabase-js';
	import { button_green, card_static, form_element } from '$lib/styles';
	import { checkAdminStatus } from '$lib/supabase/auth';
	import ThemeManager from './components/themeManager.svelte';

	const buttonStyle =
		'w-full max-w-60 m-auto block text-center rounded-xl cursor-pointer mb-2 p-0.5 border-2 hover:bg-stone-50 border-stone-500 dark:hover:bg-stone-900 dark:hover:border-stone-300 hover:border-stone-600';
</script>

<div class="p-5">
	<div class="mx-auto w-full text-center mt-20 my-10">
		<h1 class="font-bold text-6xl">LINK</h1>
		<h4 class="italic my-3">Language Integration Network Kit</h4>
	</div>
	<div class=" rounded-lg w-full max-w-96 mx-auto">
		<div class="flex-wrap px-4">
			<p class="text-lg font-semibold mb-2 text-center">
				Do you have native or bilingual fluency in Spanish, French, or Portuguese?
			</p>
			<p class="font-normal italic text-center">
				Help translate ISARIC's ARCH database of CRF questions so that our Bridge is more accessible
				to researchers and clinitians around the world
			</p>
		</div>
	</div>
	<div class="w-full max-w-96 my-auto mx-auto">
		<div class="flex-wrap border-inherit p-4">
			<p class="font-bold text-stone-700 dark:text-stone-300 w-full text-center mt-6"></p>
			<a
				data-sveltekit-preload-code="eager"
				class="w-full block max-w-60 m-auto text-xl font-semibold rounded-xl border-2 cursor-pointer p-1 text-center {button_green}"
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

	<div class="w-full flex justify-center pt-5"><ThemeManager /></div>
</div>
