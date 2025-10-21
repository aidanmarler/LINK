<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../supabaseClient';
	import type { AuthSession, User, WeakPassword } from '@supabase/supabase-js';
	import { card_static, form_element } from '$lib/styles';
	import { checkAdminStatus } from '$lib/supabase/auth';
	import ThemeManager from './components/themeManager.svelte';

	/*
	let session: AuthSession | null;
	let email: string = '';
	let password: string = '';

	
	onMount(() => {
		supabase.auth.getSession().then(({ data }) => {
			session = data.session;
			console.log(session);
			if (session) {
				window.location.href = '/home';
			}
		});

		supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
		});
	});

	async function handleSignIn(event: Event) {
		event.preventDefault();

		const { data, error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password
		});

		if (error) {
			alert('Login failed. Check email and password are correct.');
			return;
		}

		const isAdmin = await checkAdminStatus(data.user.id);

		console.log('isAdmin', isAdmin);

		if (isAdmin) {
			window.location.href = '/admin';
		} else {
			window.location.href = '/home';
		}
	}*/
</script>

<div class="p-5">
	<div class="mx-auto w-full text-center my-20">
		<h1 class="font-bold text-6xl">LINK</h1>
		<h4 class="italic my-3">Language Integration Network Kit</h4>
	</div>
	<div
		class=" rounded-lg w-full max-w-96 my-auto mx-auto
	
		"
	>
		<div class="flex-wrap p-4">
			<p class="text-lg mb-2 text-center">Are you fluent in Spanish, French, or Portuguese?</p>
			<p class="font-normal text-center">
				Help translate ISARIC's ARCH database of CRF questions so that our Bridge is more accessible
				to researchers and clinitians around the world
			</p>
		</div>
	</div>
	<div class="w-full max-w-96 my-auto mx-auto">
		<div class="flex-wrap border-inherit p-4">
			<p class="w-full italic mb-1">Returning User?</p>
			<a
				data-sveltekit-preload-code="eager"
				class="w-full block text-large text-center font-medium rounded-md cursor-pointer mb-2 p-1 border-2
				bg-stone-200 hover:bg-stone-50 dark:bg-stone-800 border-stone-500 dark:hover:bg-stone-700"
				href="/login"
			>
				Login
			</a>
			<p class="font-medium w-full text-center mt-4 mb-1">New User?</p>
			<a
				data-sveltekit-preload-code="eager"
				class="w-full block text-large text-center font-medium rounded-md cursor-pointer mb-2 p-1 border-2
				bg-stone-200 hover:bg-stone-50 dark:bg-stone-800 border-stone-500 dark:hover:bg-stone-700"
				href="/register"
			>
				New User: Register
			</a>
		</div>
	</div>

	<div class="w-full flex justify-center pt-5"><ThemeManager /></div>
</div>
