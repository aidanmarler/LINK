<script lang="ts">
	import { supabase } from '../../supabaseClient';
	import type { AvailableLanguage } from '../../lib/types';
	import { button_B, button_green, form_element } from '$lib/styles';
	import ThemeManager from '../components/themeManager.svelte';

	let name: string = '';
	let email: string = '';
	let password: string = '';
	let confirmPassword: string = '';
	let language: AvailableLanguage = 'none';
	let clinical = false;

	const inputStyle =
		'w-full text-sm font-medium rounded-md p-1 border-2 border-stone-400 dark:border-stone-500 text-black dark:text-white';
	//const labelStyle = 'leading-1.5 w-full block font-bold text-stone-800 dark:text-stone-300 bg-green-300 m-auto';
	const labelStyle = 'grid items-center font-bold text-stone-800 dark:text-stone-300 ';
	const sublabelStyle = 'grid items-center font-normal text-stone-800 dark:text-stone-300 text-xs';

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
		if (isCorrect) return 'border-green-500 bg-green-950';
		return 'border-stone-500 bg-stone-950';
	}
</script>

<div class=" max-w-96 mt-20 mx-auto border-inherit">
	<h1 class="text-3xl font-bold w-full text-center mb-2 mt-6">Register New Account</h1>
	<div
		class="
		px-7 my-5 py-7 shadow-sm border border-stone-400 dark:border-stone-800 rounded-xl w-full
		"
	>
		<form onsubmit={handleSignUp}>
			<label title="Please provide your full name as 'First Last'" class="{labelStyle} mb-3">
				Full Name
				<input
					class=" {form_element} "
					required
					name="name"
					autocomplete="name"
					type="text"
					placeholder="First Last"
					bind:value={name}
				/>
			</label>

			<label
				title="Please provide an email through which we can verify your account"
				class="{labelStyle} mb-3"
			>
				Email

				<input
					class={form_element}
					required
					name="email"
					type="email"
					id="email"
					placeholder="your@email.com"
					autocomplete="email"
					bind:value={email}
				/>
			</label>

			<label title="Please create a password" class={labelStyle}>
				Password
				<input
					class={form_element}
					required
					name="password"
					type="password"
					autocomplete="new-password"
					placeholder="Password"
					bind:value={password}
				/>
			</label>

			<label title="Please create a password" class="{labelStyle} mt-1 mb-3">
				<input
					class={form_element}
					required
					name="password"
					type="password"
					autocomplete="new-password webauthn"
					placeholder="Confirm Password"
					bind:value={confirmPassword}
				/>
			</label>

			<label
				title="Please select which language you are a native speaker or have bilingual fluency"
				class="{labelStyle} mb-3"
			>
				Native Language
				<select
					class="{form_element} cursor-pointer"
					name="language"
					required
					bind:value={language}
				>
					<!--<option value="none">None</option>-->
					<option value="spanish">Español</option>
					<option value="french">Français</option>
					<option value="portuguese">Português</option>
				</select>
			</label>

			<label
				title="Please select your profession, if not offered simply select 'Other'"
				class="{labelStyle} mb-3"
			>
				Profession
				<select class="{form_element} cursor-pointer" name="profession" required>
					<option value="clinical">Clinical Staff</option>
					<option value="researcher">Disease/Clinical Researcher</option>
					<option value="translator">Translator</option>
					<option value="survey">Survey/Questionnaire Expert</option>
					<option value="other">Other</option>
				</select>
			</label>

			<button
				type="submit"
				title="Register Account"
				class="w-full block max-w-60 m-auto text-xl font-semibold mt-8 rounded-xl border-2 cursor-pointer p-1 {button_green}"
			>
				Create Account
			</button>
		</form>
	</div>

	<div class="mt-8 w-full">
		<p class="w-full text-center font-medium mb-2">Already Registered?</p>
		<div class="w-full px-6">
			<a
				data-sveltekit-preload-code="eager"
				class="w-full max-w-60 m-auto block text-md text-center rounded-xl cursor-pointer mb-2 p-0.5 border-2 hover:bg-stone-50 border-stone-500 dark:hover:bg-stone-900 dark:hover:border-stone-300 hover:border-stone-600"
				href="/login"
			>
				Login
			</a>
		</div>
	</div>

	<div class="w-full flex justify-center pt-10"><ThemeManager /></div>
</div>
