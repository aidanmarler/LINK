<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../supabaseClient';
	import type { AuthSession, User, WeakPassword } from '@supabase/supabase-js';
	import { checkAdminStatus } from '$lib/supabase/supabaseHelpers';
	import DataView from './home/dataView.svelte';

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

<div class="p-5">
	<div class="mx-auto w-full text-center my-20">
		<h1 class="font-bold text-6xl">LINK</h1>
		<h4 class="italic my-3">Language Integration Network Kit</h4>
	</div>
	<div
		class="px-3 py-4 shadow-md border-2 border-stone-700 rounded-lg w-full bg-stone-800 max-w-96 my-auto mx-auto
		"
	>
		<h1 class="text-4xl w-full text-center mb-5 mt-2">Login</h1>
		<form onsubmit={handleSignIn}>
			<line class=" w-full"> </line>
			<label class="font-medium">
				<input
					class="w-full rounded-xs mb-2 p-1 bg-stone-950 border border-stone-500"
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
					class="w-full font-medium rounded-xs mb-2 p-1 bg-stone-950 border border-stone-500"
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
					class="w-full font-medium rounded-xs mt-6 hover:bg-green-700 cursor-pointer mb-2 p-1 bg-green-800 border border-stone-500"
				>
					Login
				</button>
			</label>
		</form>

		<div class="flex-wrap">
			<div class="w-full my-6 h-0 border border-stone-500"></div>
			<p class="font-medium w-full text-center mb-2">New User?</p>
			<a
				data-sveltekit-preload-code="eager"
				class="w-full block text-center font-medium rounded-xs hover:bg-stone-700 cursor-pointer mb-2 p-1 bg-stone-800 border border-stone-500"
				href="/register"
			>
				Register Here
			</a>
		</div>
		<div></div>
	</div>
</div>
