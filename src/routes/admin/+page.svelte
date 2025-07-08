<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../../supabaseClient';
	import type { AuthSession } from '@supabase/supabase-js';
	import { checkAdminStatus } from '$lib/supabase/supabaseHelpers';
	import type { Category, Language } from '$lib/types';
	import { PullCategory } from './retrieve_Lists';
	import Logout from '../components/logout.svelte';
	import { card_static } from '$lib/styles';

	let session: AuthSession | null;
	let isAdmin: boolean = false;
	let activeLanguages: Language[] = ['Spanish']; // ['French', 'Portuguese', 'Spanish'];Languages to check and have in the app.
</script>

{#snippet LanguageCategoryControls(language: Language)}
	<div class="p-2 space-y-1 mt-2">
		<div class="flex justify-between mb-3">
			<h3 class="text-2xl w-20">{language}</h3>
			<button
				title="Push Updated Lists to GitHub"
				class="bg-green-900 border-2 border-green-600 px-3 py-0 font-semibold rounded-lg cursor-pointer
							hover:bg-green-700 hover:border-green-400"
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

<div class="max-w-96 p-2 rounded-lg {card_static}">
	<button
		title="Pull Lists from GitHub"
		class="bg-blue-900 border-2 border-blue-600 px-3 font-semibold rounded-lg cursor-pointer
						hover:bg-blue-700 hover:border-blue-400"
		onclick={async () => {
			for (const language of activeLanguages) {
				await PullCategory('Lists', language);
			}
		}}
	>
		Pull Lists
	</button>

	<button
		title="Pull ARCH from GitHub"
		class="bg-blue-900 border-2 border-blue-600 px-3 font-semibold rounded-lg cursor-pointer
						hover:bg-blue-700 hover:border-blue-400"
		onclick={async () => {
			for (const language of activeLanguages) {
				await PullCategory('Questions', language);
			}
		}}
	>
		Pull ARCH
	</button>
</div>

{@render CategoryControls('Lists')}
