<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../supabaseClient';
	import type { AuthSession, User, WeakPassword } from '@supabase/supabase-js';
	import DataView from './components/dataView.svelte';
	import ThemeManager from './components/themeManager.svelte';
	import { card_static, form_element } from '$lib/styles';
	import { checkAdminStatus } from '$lib/supabase/auth';

	let session: AuthSession | null;
	let email: string = '';
	let password: string = '';

	onMount(() => {
		supabase.auth.getSession().then(({ data }) => {
			session = data.session;
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
	}
</script>

<ThemeManager />

<div class="p-5">
	<div class="mx-auto w-full text-center my-20">
		<h1 class="font-bold text-6xl">LINK</h1>
		<h4 class="italic my-3">Language Integration Network Kit</h4>
	</div>
	<div
		class="shadow-md rounded-lg w-full max-w-96 my-auto mx-auto
		{card_static}
		"
	>
		<div class="p-4">
			<!--
			<h1 class="text-4xl w-full text-center p-2">Login</h1>
			-->
			<form onsubmit={handleSignIn}>
				<line class="w-full"> </line>
				<label class="font-medium">
					<input
						class={"w-full  mb-1 " + form_element}
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
						class={"w-full mb-4 " + form_element}
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
						class="w-full font-medium rounded-md hover:bg-green-800 cursor-pointer p-1 bg-green-900 border-2 border-green-700"
					>
						Login
					</button>
				</label>
			</form>
		</div>

		<div class="flex-wrap border-t border-inherit p-4">
			<p class="font-medium w-full text-center mb-2">New User?</p>
			<a
				data-sveltekit-preload-code="eager"
				class="w-full block text-center font-medium rounded-md cursor-pointer mb-2 p-1 border-2
				bg-stone-200 dark:bg-stone-800 border-stone-500 dark:hover:bg-stone-700"
				href="/register"
			>
				Register Here
			</a>
		</div>
		<div></div>
	</div>
</div>
