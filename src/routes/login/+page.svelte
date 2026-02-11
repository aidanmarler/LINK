<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../../supabaseClient';
	import type { AuthSession, User, WeakPassword } from '@supabase/supabase-js';
	import DataView from '../components/dataView.svelte';
	import ThemeManager from '../components/themeManager.svelte';
	import { button_green, card_static, form_element } from '$lib/styles';
	import { checkAdminStatus } from '$lib/supabase/auth';
	import { goto } from '$app/navigation';

	let session: AuthSession | null;
	let email: string = '';
	let password: string = '';

	onMount(() => {
		supabase.auth.getSession().then(({ data }) => {
			session = data.session;
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
			goto('/admin');
		} else {
			goto('/home');
		}
	}
</script>

<div class="p-4">
	<div class="mx-auto w-full text-center my-20">
		<h1 class="font-bold text-7xl">LINK</h1>
		<h4 class="italic my-3 text-lg">Language Integration Network Kit</h4>
	</div>
	<div
		class="shadow-md rounded-lg w-full max-w-96 my-auto mx-auto
		{card_static}
		"
	>
		<div class="p-5">
			<!--
			<h1 class="text-4xl w-full text-center p-2">Login</h1>
			-->
			<form class="text-xl" onsubmit={handleSignIn}>
				<line class="w-full"> </line>
				<label class="font-medium">
					<input
						class={'w-full  mb-1  ' + form_element}
						required
						name="email"
						type="email"
						id="email"
						placeholder="Email"
						autocomplete="email"
						bind:value={email}
					/>
				</label>
				<label class="font-medium">
					<input
						class={'w-full mb-4 ' + form_element}
						required
						name="password"
						type="password"
						placeholder="Password"
						autocomplete="current-password"
						bind:value={password}
					/>
				</label>
				<label>
					<button
						type="submit"
						class="w-full block max-w-60 mt-3 mb-1 m-auto text-2xl font-semibold rounded-xl border-2 cursor-pointer p-1 {button_green}"
					>
						Login
					</button>
				</label>
			</form>
		</div>
	</div>
	<div class="flex-wrap border-inherit text-lg p-4">
		<p class="font-semibold w-full text-center">New User?</p>
		<a
			data-sveltekit-preload-code="eager"
			class="w-full max-w-60 m-auto block text-center rounded-xl cursor-pointer mb-2 p-0.5 border-2 hover:bg-stone-50 border-stone-500 dark:hover:bg-stone-900 dark:hover:border-stone-300 hover:border-stone-600"
			href="/register"
		>
			Create Account
		</a>
	</div>
	<div class="w-full flex justify-center pt-5"><ThemeManager /></div>
</div>
