<script lang="ts">
	import {
		global_address,
		global_lists,
		global_lists_report,
		loadedStatus,
		reset_address
	} from '$lib/global.svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import DataView from '../../../../components/dataView.svelte';
	import TranslationForm from './translationForm.svelte';
	import type { ListAddress } from '$lib/types';

	let pathSegments = $derived(page.url.pathname.split('/').filter(Boolean));
	let crumb = $derived(pathSegments[pathSegments.length - 1]);
	let reverse = $state(1);
	let openConfirmationModal = $state(false);

	onMount(() => {
		reset_address();
		// Set Global Address
		Object.assign(global_address, {
			category: 'Lists',
			listKey: $state.snapshot(pathSegments[pathSegments.length - 2]),
			sublistKey: $state.snapshot(pathSegments[pathSegments.length - 1])
		} satisfies ListAddress);
	});

	function submitForm() {
		// Open modal to confirm submission
		// If confirmed, update Supabase with the translation

		console.log('Submitting translation...');
	}

	/*

	This must create a bunch of Forms.  
	Each form should be the better part of a page and have (1) the original text, (2) a list of all translation options, (3) buttons to Comment, Submit, or Skip.

	Upon clicking Submit, a modal should pop up presenting the user with what they are about to do and to either confirm or cancel.

	Finally, when fully submitted, Supabase should be updated with the translation. 
	First, it go through the whole subsublist (orginal text) and add the current user's ID to "users viewed" of each translation option.
	Second, if the user has selected an existing translation, it should add the current user's ID to "users voted" of that translation option.
	Finally, if instead the user created a new translation (or modified an existing one), it should add the new translation to the database and add the user ID to both seen and voted for.

	*/
</script>

{#if loadedStatus.lists}
	<!-- Form Content -->
	<div
		in:fly|global={{ x: 10 * reverse, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10 * reverse, duration: 100 }}
		class="mb-32"
	>
		{#if global_lists[pathSegments[2]] && global_lists[pathSegments[2]][pathSegments[3]]}
			{#each Object.entries(global_lists[pathSegments[2]][pathSegments[3]]) as [translation], i (translation)}
				{#if global_lists[pathSegments[2]][pathSegments[3]][translation]}
					<TranslationForm
						originalKey={translation}
						originalItem={global_lists[pathSegments[2]][pathSegments[3]][translation]}
						completionStatus={global_lists_report.lists[pathSegments[2]].sublists[pathSegments[3]]
							.originalItems[translation]}
					/>
				{/if}
				{#if i < Object.entries(global_lists[pathSegments[2]][pathSegments[3]]).length - 1}
					<hr class="text-stone-500 my-16" />
				{/if}
			{/each}
		{/if}
	</div>

	<!-- Progress bar -->
	<div
		in:fly={{ y: 20, duration: 500, delay: 100 }}
		out:fly={{ y: 20, duration: 100 }}
		class="dark:bg-stone-900/50 dark:border-stone-700 bg-stone-300/50 border-stone-500 border-t fixed bottom-0 left-0 backdrop-blur-md w-full h-auto p-2 flex justify-between"
	>
		<div class="flex w-full items-center space-x-2">
			<p class="text-3xl italic p-2">{crumb}</p>
			<div class="w-full px-2 md:pr-20 lg:pr-32">
				<DataView
					completionReport={global_lists_report.lists[pathSegments[2]].sublists[crumb]
						.sublistReport}
					options={{}}
				/>
			</div>
		</div>
		<div class="flex justify-end w-1/2 items-center space-x-3 pr-2">
			<button
				class="cursor-pointer font-semibold block border-2 opacity-70 hover:opacity-90 rounded-lg p-1 px-3"
			>
				Top of page
			</button>
			<button
				class="cursor-pointer font-semibold block border-2 opacity-70 hover:opacity-90 rounded-lg p-1 px-3"
			>
				Next
			</button>
		</div>
	</div>

	<!-- Confim / Cancel Submission Modal -->
	{#if openConfirmationModal}
		<div
			in:fly={{ y: -10, duration: 100 }}
			out:fly={{ y: -10, duration: 50 }}
			class="w-full max-w-96 fixed left-[50%] top-[50%] h-52 translate-[-50%]"
		>
			<div
				class="bg-stone-800/50 border-2 backdrop-blur-lg border-stone-500 rounded-lg p-4 flex flex-col items-center justify-center"
			>
				<p class="text-xl font-semibold">Confirm Submission</p>
				<p class="text-sm text-center">Are you sure you want to submit this translation?</p>
				<div class="flex justify-around w-full mt-4">
					<button
						onclick={() => {
							openConfirmationModal = false;
						}}
						class="block cursor-pointer font-semibold bg-red-600/50 border-2 border-red-600 px-3 p-1 rounded-lg justify-around"
					>
						Cancel
					</button>
					<button
						class="block cursor-pointer font-semibold bg-green-700/50 border-2 border-green-700 px-3 p-1 rounded-lg justify-around"
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
