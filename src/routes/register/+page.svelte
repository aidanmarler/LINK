<script lang="ts">
	import { supabase } from '../../supabaseClient';
	import type { availableLanguages } from '../../lib/types';

	let name: string = '';
	let email: string = '';
	let password: string = '';
	let confirmPassword: string = '';
	let language: availableLanguages = 'none';
	let clinical = false;

	async function handleSignUp(event: Event) {
		event.preventDefault();

		if (password !== confirmPassword) {
			alert('Passwords do not match');
			return;
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					name,
					language,
					clinical_expertise: clinical
				}
			}
		});

		if (error) {
			alert(error.message);
		} else {
			alert('Sign up successful! Please check your email to confirm your account.');
			// Optionally redirect the user or clear the form
			name = '';
			email = '';
			password = '';
			confirmPassword = '';
			language = 'none';
			clinical = false;
		}
	}

	function colorEntry(isCorrect: boolean, isIncorrect: boolean = false) {
		if (isIncorrect) return 'border-red-500 bg-red-950';
		if (isCorrect) return 'border-emerald-500 bg-emerald-950';
		return 'border-stone-500 bg-stone-950';
	}
</script>

<div class="p-3">
	<div
		class="
		px-3 py-4 shadow-md border-2 border-stone-700 rounded-lg w-full bg-stone-800 max-w-96 my-5 mx-auto
		"
	>
		<h1 class="text-4xl w-full text-center mb-8 mt-4">Register</h1>
		<form onsubmit={handleSignUp} class="border border-stone-600 p-3 rounded-xs">
			<label class="font-medium leading-1.5">
				User Information
				<input
					class=" w-full text-sm rounded-xs mb-1 p-1 border {colorEntry(name.length < 0)} "
					required
					name="name"
					autocomplete="name"
					type="text"
					placeholder="Full Name"
					bind:value={name}
				/>
				<input
					class="w-full text-sm rounded-xs mb-4 p-1 bg-stone-950 border border-stone-500"
					required
					name="email"
					type="email"
					id="email"
					placeholder="Email"
					autocomplete="email"
					bind:value={email}
				/>
			</label>

			<label class="font-medium leading-1.5">
				Password
				<input
					class="w-full text-sm font-medium rounded-xs mb-1 p-1 bg-stone-950 border border-stone-500"
					required
					name="password"
					type="password"
					autocomplete="new-password"
					placeholder="Password"
					bind:value={password}
				/>
				<input
					class="w-full text-sm font-medium rounded-xs mb-3 p-1 bg-stone-950 border border-stone-500"
					required
					name="password"
					type="password"
					autocomplete="new-password webauthn"
					placeholder="Confirm Password"
					bind:value={confirmPassword}
				/>
			</label>

			<label class="font-medium leading-1.5">
				Language Expertise
				<select
					class="w-full text-sm font-medium rounded-xs mb-3 p-1 bg-stone-950 border border-stone-500"
					name="language"
					required
					bind:value={language}
				>
					<option value="none">None</option>
					<option value="spanish">Español</option>
					<option value="french">Français</option>
					<option value="portuguese">Português</option>
				</select>
			</label>
			<label class="font-medium leading-1.5 content-center text-center items-center h-10">
				Clinical Expertise
				<input
					type="checkbox"
					class="font-medium accent-green-500/70 mb-3 rounded-xs h-4 w-4 cursor-pointer p-1 bg-stone-950 border border-stone-500"
					name="clinical"
					bind:checked={clinical}
				/>
			</label>
			<label>
				<button
					type="submit"
					class="w-full font-medium rounded-xs mt-8 hover:bg-green-700 cursor-pointer mb-2 p-1 bg-green-800 border border-stone-500"
				>
					Register
				</button>
			</label>
		</form>

		<div class="mt-8 w-full">
			<div class="w-full flex mb-8 h-0 border border-stone-500"></div>
			<p class="w-full text-center font-medium mb-2">Already Registered?</p>
			<div class="w-full">
				<a
					data-sveltekit-preload-code="eager"
					class="w-full block text-center font-medium rounded-xs hover:bg-stone-700 cursor-pointer mb-2 p-1 bg-stone-800 border border-stone-500"
					href="/"
				>
					Login
				</a>
			</div>
		</div>
	</div>
</div>
