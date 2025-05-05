<script lang="ts">
	import {
		global_address,
		global_lists,
		updateGlobalTables,
		userProfile
	} from '$lib/global.svelte';
	import {
		insertListItems,
		lists_addSeenToAll,
		lists_addVote,
		lists_removeVotesFromAll
	} from '$lib/supabase/supabaseHelpers';
	import type { TranslationLanguage } from '$lib/types';
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	let {
		openConfirmationModal = $bindable(),
		originalText,
		translatedText,
		isNewTranslation,
		translationId,
		newTranslationData
	}: {
		openConfirmationModal: boolean;
		originalText: string;
		translatedText: string;
		isNewTranslation: boolean;
		translationId: string | null;
		newTranslationData?: {
			list: string;
			sublist: string;
			original: string;
		};
	} = $props();

	// Clear selection state
	const confirmTranslation = async (
		translationId?: string,
		originalKey?: string,
		data?: {
			language: string;
			list: string;
			sublist: string;
			original: string;
			translation: string;
		}
	) => {
		if (!userProfile.user) {
			console.error('No user to confirm translation');
			return;
		}
		const userLanguage = userProfile.user.language as TranslationLanguage;
		if (isNewTranslation) {
			if (!data) {
				console.error('No new translation data');
				return;
			}
			// Supabase call - add item to table
			insertListItems([data]);
			// Once complete, reload dataset
			await updateGlobalTables(userProfile.user.language as TranslationLanguage);
			await tick();
			openConfirmationModal = false;
		} else {
			if (!translationId) {
				console.error('No translation id');
				return;
			}
			if (!global_address.listKey || !global_address.sublistKey || !originalKey) {
				console.error('Incomplete Address');
				return;
			}
			// Get a list of all related questions
			const translationOptions =
				global_lists[global_address.listKey][global_address.sublistKey][originalKey];

			console.log(translationOptions);
			return;
			const result_addSeen = await lists_addSeenToAll(userProfile.user.id, []);
			//const result_removeVotes = await lists_removeVotesFromAll();
			const result = await lists_addVote(userProfile.user.id, translationId);
			if (result.success == true) {
				// Once complete, reload dataset
				await updateGlobalTables(userProfile.user.language as TranslationLanguage);
				await tick();
				openConfirmationModal = false;
			} else {
				console.log('hmm, didnt succeed', result);
			}
		}
	};
</script>

{#if openConfirmationModal}
	<div
		class="w-full h-full backdrop-blur-sm z-10 fixed top-0 left-0 pointer-events-auto transition-all duration-1000"
	>
		<div
			in:fly={{ y: -10, duration: 100 }}
			out:fly={{ y: -10, duration: 50 }}
			class="w-full mx-3 max-w-96 fixed left-[50%] top-[50%] translate-[-50%]"
		>
			<div
				class="bg-stone-800/80 border-2 backdrop-blur-xl border-stone-500 rounded-lg flex flex-col items-center justify-center"
			>
				<div class=" p-5 w-full items-center text-center">
					<p class="text-xl font-medium space-y-3 py-5 text-stone-400 text-center">
						In {userProfile.user?.language}, <br />
						<span class="text-white text-2xl tracking-wider">"{originalText}"</span>
						<br /> is best translated as <br />
						<span class="text-white text-2xl tracking-wider">"{translatedText}"</span>
					</p>
				</div>
				<div class="border-t-2 border-stone-500 p-5 w-full items-center text-center">
					<p class="text-xl font-semibold">Confirm Submission?</p>
					<div class="flex justify-around w-full mt-4 space-x-5">
						<button
							onclick={() => {
								openConfirmationModal = false;
							}}
							class="block w-full cursor-pointer opacity-70 hover:opacity-100 font-semibold bg-red-600/50 border-2 border-red-600 px-3 p-1 rounded-lg justify-around"
						>
							Cancel
						</button>
						<button
							class="block w-full cursor-pointer opacity-70 hover:opacity-100 font-semibold bg-green-700/50 border-2 border-green-700 px-3 p-1 rounded-lg justify-around"
							onclick={() => {
								confirmTranslation(translationId ? translationId : undefined);
							}}
						>
							Confirm
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
