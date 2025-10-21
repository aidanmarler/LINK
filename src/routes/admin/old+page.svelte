<script lang="ts">
	import type { Category, GithubLanguage } from '$lib/types';
	import { PullCategory } from './retrieve_Lists';
	import { card_static } from '$lib/styles';
	let activeLanguages: GithubLanguage[] = ['Spanish']; //, 'French', 'Portuguese'];

	let ARCHVersion = $state('1.1.0');
</script>

{#snippet LanguageCategoryControls(language: GithubLanguage)}
	<div class="p-2 space-y-1 mt-2">
		<div class="flex justify-between mb-3">
			<h3 class="text-2xl w-20">{language}</h3>
			<button
				title="Push Updated Lists to GitHub"
				class="dark:bg-green-900 border-2 border-green-600 px-3 py-0 font-semibold rounded-lg cursor-pointer
							dark:hover:bg-green-700 hover:border-green-400"
			>
				Push Lists
			</button>
		</div>

		<div class="flex w-full space-x-0.5 h-5 px-1">
			<div
				title="3 translations to review"
				class=" bg-yellow-500 opacity-100 rounded-xs border-2 border-yellow-400 w-[2%]"
			></div>
			<div
				title="143 translations verified by 3 experts"
				class=" bg-blue-500 opacity-50 rounded-xs border-2 border-blue-400 w-[57%]"
			></div>
			<div
				title="51 translations verified by 2 experts"
				class="bg-blue-400 opacity-50 rounded-xs border-2 border-blue-300 w-[30%]"
			></div>
			<div
				title="52 translations verified by 1 experts"
				class="bg-blue-300 opacity-50 rounded-xs border-2 border-blue-200 w-[30%]"
			></div>
			<div
				title="87 translations not yet verified"
				class="bg-red-200 opacity-50 rounded-xs border-2 border-red-100 w-[79%]"
			></div>
		</div>
		<div>
			<h1>Questions to review:</h1>
			<div class="p-1 space-y-1">
				<button class="w-full rounded-sm text-left px-2 bg-stone-700">Here</button>
				<button class="w-full rounded-sm text-left px-2 bg-stone-700">Here</button>
				<button class="w-full rounded-sm text-left px-2 bg-stone-700">Here</button>
			</div>
		</div>
	</div>
{/snippet}

{#snippet CategoryControls(category: Category)}
	<div class="w-full mt-5">
		<div class="mt-1 w-full rounded-lg {card_static}">
			<div class="flex justify-between items-end p-2 border-b border-inherit">
				<h1 class="text-3xl font-semibold">{category}</h1>
				<div class="space-x-1">
					<!--
										<button
						title="Pull Lists from GitHub"
						class="bg-blue-900 border-2 border-blue-600 px-3 font-semibold rounded-lg cursor-pointer
						hover:bg-blue-700 hover:border-blue-400"
						onclick={async () => {
							for (const language of activeLanguages) {
								await PullCategory(category, language);
							}
						}}
					>
						Pull Lists
					</button>

					-->
				</div>
			</div>

			{@render LanguageCategoryControls('Spanish')}
			{@render LanguageCategoryControls('French')}
		</div>
	</div>
{/snippet}

<div class="max-w-96 flex-wrap space-x-2 flex p-2 rounded-lg {card_static}">
	<button
		title="Pull Lists from GitHub"
		class="dark:bg-blue-900 border-2 border-blue-600 px-3 font-semibold rounded-lg cursor-pointer
						hover:bg-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400"
		onclick={async () => {
			for (const language of activeLanguages) {
				await PullARCTranslations(ARCHVersion);
			}
		}}
	>
		Print ARC
	</button>
	<button
		title="Pull Lists from GitHub"
		class="dark:bg-blue-900   border-2 border-blue-600 px-3 font-semibold rounded-lg cursor-pointer
						hover:bg-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400"
		onclick={async () => {
			for (const language of activeLanguages) {
				await PullCategory('Lists', language, ARCHVersion);
			}
		}}
	>
		Pull Lists
	</button>

	<button
		title="Pull ARCH from GitHub"
		class="dark:bg-blue-900 border-2 border-blue-600 px-3 font-semibold rounded-lg cursor-pointer
						dark:hover:bg-blue-700 hover:border-blue-400"
		onclick={async () => {
			for (const language of activeLanguages) {
				await PullCategory('Questions', language, ARCHVersion);
			}
		}}
	>
		Pull ARCH
	</button>

	<input
		class=" border-2 px-3 w-20 font-semibold rounded-lg
						"
		bind:value={ARCHVersion}
	/>
</div>

{@render CategoryControls('Lists')}
