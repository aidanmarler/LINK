<script lang="ts">
	import {
		global_address,
		global_lists,
		updateGlobalTables,
		userProfile
	} from '$lib/global.svelte';
	import {
		insertListItems,
		lists_addOption,
		lists_addSeenToAll,
		lists_addVote,
		lists_removeVotesFromAll
	} from '$lib/supabase/supabaseHelpers';
	import type { availableLanguages, TranslationLanguage } from '$lib/types';
	import { tick } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { draw, fly } from 'svelte/transition';

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

	// is confirming tranlation
	let loading = $state({ started: false, addSeen: false, removeVotes: false, addVote: false });

	// Clear selection state
	const confirmTranslation = async (
		originalKey: string,
		translationId?: string,
		newTranslationText?: string
	) => {
		if (!userProfile.user) {
			console.error('No user to confirm translation');
			return;
		}
		const userLanguage = userProfile.user.language as TranslationLanguage;
		const userId = userProfile.user.id;
		loading.started = true;
		if (isNewTranslation) {
			if (!newTranslationText) {
				console.error('No new translation text');
				return;
			}
			// check address is there
			if (!global_address.listKey || !global_address.sublistKey) {
				console.error('Incomplete Address');
				return;
			}
			// get all competing tranlation options
			const transitionOptions = Object.keys(
				global_lists[global_address.listKey][global_address.sublistKey][originalKey]
			);
			// 1) add user to seen for all options
			const result_addSeen = await lists_addSeenToAll(userId, transitionOptions);
			if (result_addSeen.success == false) return;
			loading.addSeen = true;
			// 2) remove users other votes from all options
			const result_removeVotes = await lists_removeVotesFromAll(userId, transitionOptions);
			if (result_removeVotes.success == false) return;
			loading.removeVotes = true;
			// Supabase call - add item to table
			const result_addOption = await lists_addOption(
				userId,
				userLanguage,
				global_address.listKey,
				global_address.sublistKey,
				originalKey,
				newTranslationText
			);
			if (result_addOption.success == false) return;
			loading.addVote = true;
			// Once complete, reload dataset
			await updateGlobalTables(userLanguage);
			openConfirmationModal = false;
		} else {
			// check for current translation to vote for's ID
			if (!translationId) {
				console.error('No translation id');
				return;
			}
			// check address is there
			if (!global_address.listKey || !global_address.sublistKey) {
				console.error('Incomplete Address');
				return;
			}
			// get all competing tranlation options
			const transitionOptions = Object.keys(
				global_lists[global_address.listKey][global_address.sublistKey][originalKey]
			);
			// 1) add user to seen for all options
			const result_addSeen = await lists_addSeenToAll(userId, transitionOptions);
			if (result_addSeen.success == false) return;
			loading.addSeen = true;
			// 2) remove users other votes from all options
			const result_removeVotes = await lists_removeVotesFromAll(userId, transitionOptions);
			if (result_removeVotes.success == false) return;
			loading.removeVotes = true;
			// 3) add user new vote to selected option
			const result_addVote = await lists_addVote(userId, translationId);
			if (result_addVote.success == false) {
				console.log('hmm, didnt succeed', result_addVote);
				return;
			}
			loading.addVote = true;
			// Once 3 steps are complete, reload the dataset
			await updateGlobalTables(userLanguage);
			openConfirmationModal = false;
		}
	};
</script>

{#if openConfirmationModal}
	<div
		class="w-full h-full backdrop-blur-sm z-10 fixed top-0 left-0 pointer-events-auto transition-all duration-1000"
	>
		<div
			in:fly|global={{ y: -10, duration: 100 }}
			out:fly|global={{ y: -10, duration: 50 }}
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
							class="block w-full cursor-pointer opacity-70 hover:opacity-100 font-semibold bg-rose-600/50 border-2 border-rose-600 px-3 p-1 rounded-lg justify-around"
						>
							Cancel
						</button>
						<button
							class="block w-full cursor-pointer opacity-70 hover:opacity-100 font-semibold bg-emerald-700/50 border-2 border-emerald-700 px-3 p-1 rounded-lg justify-around"
							onclick={() => {
								confirmTranslation(
									originalText,
									translationId ? translationId : undefined,
									translatedText
								);
							}}
						>
							Confirm
						</button>
					</div>
				</div>
			</div>
			<div class="flex justify-center h-15 w-full">
				{#if loading.started}
					<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
						<path
							transition:draw={{ duration: 8000, easing: quintOut }}
							fill="none"
							stroke="#fff"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M13.213 9.787a3.39 3.39 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961"
						/>
					</svg>
				{/if}
			</div>
			<div class="flex h-8 justify-center w-full">
				<div class="w-6 justify-center flex">
					{#if loading.addSeen}
						<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
							<g
								fill="none"
								stroke="#fff"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							>
								<path
									stroke-dasharray="64"
									stroke-dashoffset="64"
									d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z"
								>
									<animate
										fill="freeze"
										attributeName="stroke-dashoffset"
										dur="0.2s"
										values="64;0"
									/>
								</path>
								<path stroke-dasharray="14" stroke-dashoffset="14" d="M8 12l3 3l5 -5">
									<animate
										fill="freeze"
										attributeName="stroke-dashoffset"
										dur="0.2s"
										values="14;0"
									/>
								</path>
							</g>
						</svg>
					{/if}
				</div>

				<div class="w-6 justify-center flex">
					{#if loading.removeVotes}
						<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
							<g
								fill="none"
								stroke="#fff"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							>
								<path
									stroke-dasharray="64"
									stroke-dashoffset="64"
									d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z"
								>
									<animate
										fill="freeze"
										attributeName="stroke-dashoffset"
										dur="0.2s"
										values="64;0"
									/>
								</path>
								<path stroke-dasharray="14" stroke-dashoffset="14" d="M8 12l3 3l5 -5">
									<animate
										fill="freeze"
										attributeName="stroke-dashoffset"
										dur="0.2s"
										values="14;0"
									/>
								</path>
							</g>
						</svg>
					{/if}
				</div>
				<div class="w-6 justify-center flex">
					{#if loading.addVote}
						<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
							<g
								fill="none"
								stroke="#fff"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							>
								<path
									stroke-dasharray="64"
									stroke-dashoffset="64"
									d="M3 12c0 -4.97 4.03 -9 9 -9c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9Z"
								>
									<animate
										fill="freeze"
										attributeName="stroke-dashoffset"
										dur="0.2s"
										values="64;0"
									/>
								</path>
								<path stroke-dasharray="14" stroke-dashoffset="14" d="M8 12l3 3l5 -5">
									<animate
										fill="freeze"
										attributeName="stroke-dashoffset"
										dur="0.2s"
										values="14;0"
									/>
								</path>
							</g>
						</svg>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
