<script lang="ts">
	import { button } from '$lib/styles';
	import { capitalizeFirstLetter } from '$lib/utils/utils';
	import { fade } from 'svelte/transition';
	let {
		profile
	}: {
		profile: {
			clinical_expertise: boolean | null;
			created_at: string;
			id: string;
			is_admin: boolean;
			language: string | null;
			name: string | null;
			profession: string | null;
			selected_preset: string | null;
		};
	} = $props();

	const language = $derived(capitalizeFirstLetter(profile.language ? profile.language : ''));
</script>

<div class="w-full text-stone-800 dark:text-stone-300">
	<div class="max-w-3xl p-2 m-auto text-lg font-normal">
		<h3 class="italic text-3xl p-0 font-medium w-full mb-10 text-center">
			<span class=""
				><span class="font-bold">L</span>anguage
				<span class="font-bold">I</span>ntegration
				<span class="font-bold">N</span>etwork
				<span class="font-bold">K</span>it</span
			>
		</h3>
		<p class="text-center">
			Welcome, <em in:fade={{ duration: 1000, delay: 100 }}>{profile.name}</em>
		</p>
		<p class="mb-8 w-full italic text-center text-base">
			Thank you ❤️ for helping to translate ARC from English into {language}.
		</p>

		<p>
			Each word or phrase will be translated from English into {language} using two steps:
		</p>

		<ol class="p-3">
			<li>
				1. <span class="font-bold"> Translate:</span> translate phrases from English into {language}.
			</li>
			<li>
				2. <span class="font-bold"> Review:</span> select the correct translation, or write a new one
				with a justification.
			</li>
		</ol>

		<p class="text-base text-center py-6">
			All translations will be reviewed, and the ones that are agreed by your peers to be best will
			be added to the ARC database to be used around the world!
		</p>
		<p class="text-base text-center">
			If you do not know, <span class="font-bold"> skip</span><svg
				class="w-5 h-5 inline mb-0.5 ml-0.5"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 28 28"
			>
				<path
					fill="currentColor"
					d="M15.637 4.857c-1.066-.845-2.635-.086-2.635 1.273v4.57L5.636 4.858c-1.065-.845-2.634-.086-2.634 1.273V21.87c0 1.359 1.57 2.118 2.634 1.273l7.366-5.84v4.565c0 1.359 1.57 2.118 2.634 1.273l9.637-7.64a1.917 1.917 0 0 0 0-3.004z"
				/>
			</svg>
		</p>
		<p class="text-base text-center">
			If you have something to say, <span class="font-bold">leave a comment</span><svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				class="inline mb-0.5 ml-0.5"
				height="24"
				viewBox="0 0 24 24"
			>
				<path
					fill="currentColor"
					class=" h-5 stroke-2 w-5 inline"
					d="M5 8a1 1 0 0 0 2 0V7h1a1 1 0 0 0 0-2H7V4a1 1 0 0 0-2 0v1H4a1 1 0 0 0 0 2h1Zm13-3h-6a1 1 0 0 0 0 2h6a1 1 0 0 1 1 1v9.72l-1.57-1.45a1 1 0 0 0-.68-.27H8a1 1 0 0 1-1-1v-3a1 1 0 0 0-2 0v3a3 3 0 0 0 3 3h8.36l3 2.73A1 1 0 0 0 20 21a1.1 1.1 0 0 0 .4-.08A1 1 0 0 0 21 20V8a3 3 0 0 0-3-3"
				/>
			</svg>
		</p>

		<p class="mt-10 mb-4 text-center">
			⚠️ As this is LINK's Pilot Test, you will likely encounter bugs and issues when using the app.
			When that happens, <a
				target="_blank"
				href="https://minimart.games"
				title="Issue Report Form"
				class="font-bold bg-stone-200 {button.simple
					.active} rounded-lg p-0.5 px-1 hover:underline cursor-pointer"
				>📋 please report the issue here.</a
			>
		</p>

		<p class="text-center text-xl font-medium py-6">Thank you, and happy translating!</p>
	</div>
</div>

<!--
					<p>High-quality translations require three steps:</p>
					<ol class="p-3">
						<li>
							1. <span class="font-bold"> Forward Translation:</span> translate phrases from English
							into {capitalizeFirstLetter(profile.language ? profile.language : '')}.
						</li>
						<li>
							2. <span class="font-bold"> Review:</span> select the correct translation, or write a new
							one with a justification.
						</li>
						<li>
							3. <span class="font-bold"> Backward Translation:</span> translating reviewed translations
							back into English.
						</li>
					</ol>
					-->
