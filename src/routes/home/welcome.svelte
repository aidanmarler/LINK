<script lang="ts">
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
			Each word or phrase will be translated from English into {language} in using two steps:
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
			If you do not know, <span class="font-bold"> skip</span>
		</p>
		<p class="text-base text-center">
			If you have something to say, <span class="font-bold">leave a comment</span>
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
