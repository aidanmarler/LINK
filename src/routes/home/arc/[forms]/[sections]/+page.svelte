<script lang="ts">
	import { page } from '$app/state';
	import {
		addressBook,
		answerTableTree,
		definitionTableTree,
		formTableTree,
		global_address,
		guideTableTree,
		loadedStatus,
		questionTableTree,
		reset_address,
		sectionTableTree,
		userProfile
	} from '$lib/global.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type {
		ForwardTranslation,
		LabelAddress,
		TranslationLanguage,
		VariableCategory,
		GuideItem,
		QuestionItem,
		BaseItem
	} from '$lib/types';
	import ForwardTranslationsForm from '../../../../components/forms/forwardTranslationsForm.svelte';
	import ToggleSwitch from '../../../../components/toggleSwitch.svelte';

	type UserForm = 'Forward Translate' | 'Review' | 'Backward Translate';
	let currentForm: UserForm = $state('Forward Translate');
	let forms: UserForm[] = ['Forward Translate', 'Review', 'Backward Translate'];

	interface VariableCategoryConfig {
		label: string;
		visible: boolean;
	}

	const categories: Partial<Record<VariableCategory, VariableCategoryConfig>> = $state({
		questions: {
			label: 'Questions',
			visible: true
		},
		answers: {
			label: 'Answers',
			visible: true
		},
		definitions: {
			label: 'Definitions',
			visible: false
		},
		completion_guides: {
			label: 'Completion Guides',
			visible: false
		}
	});

	// svelte-ignore non_reactive_update
	let forwardTranslationsFormRef: ForwardTranslationsForm;

	let form_nav = $derived(page.url.pathname.split('/').filter(Boolean)[2]);
	let form = $derived(addressBook.forms[form_nav].branch.id);
	let section_nav = $derived(page.url.pathname.split('/').filter(Boolean)[3]);
	let section = $derived(addressBook.forms[form_nav].sections[section_nav].branch.id);
	let questionSegments = $derived(questionTableTree.data.forms[form].sections[section].segments);
	let guideSegments = $derived(guideTableTree.data.forms[form].sections[section].segments);
	let definitionSegments = $derived(
		definitionTableTree.data.forms[form].sections[section].segments
	);
	let answerSegments = $derived(answerTableTree.data.segments);

	let forwardTranslations: Record<string, ForwardTranslation[]> = $derived.by(() => {
		// Create a map to group by variable_id
		const translationsByVariableId: Record<string, ForwardTranslation[]> = {};
		// Process definition segments
		if (!userProfile.user) return {};
		const userId = userProfile.user.id;
		const userLanguage = userProfile.user.language as TranslationLanguage;

		// Process Question segments
		Object.entries(questionSegments).forEach(([questionSegment, segmentData]) => {
			const variableId = segmentData.variableId;
			const answer_options = $state.snapshot(segmentData.answer_options);

			let translated = false;
			for (const translation in segmentData.translations) {
				if (segmentData.translations[translation].user_created == userId) {
					translated = true;
					console.log(segmentData.translations[translation].comment);
					const oldTranslation: ForwardTranslation = {
						table: 'questions', // Changed from 'completion_guides' to 'definitions'
						skipped: false, // !change get skipped
						completed: true,
						comment: segmentData.translations[translation].comment, // !change get comment
						open: false, //categories.questions ? categories.questions.visible : false,
						category: 'questions',
						item: {
							answer_options: answer_options,
							segment: questionSegment,
							translation: segmentData.translations[translation].translation,
							language: userLanguage,
							form: form,
							variable_id: variableId,
							section: section
						} satisfies QuestionItem
					};

					if (!translationsByVariableId[variableId]) {
						translationsByVariableId[variableId] = [];
					}

					translationsByVariableId[variableId].push(oldTranslation);
				}
			}

			if (!translated) {
				const translation: ForwardTranslation = {
					table: 'questions', // Changed from 'completion_guides' to 'definitions'
					skipped: false, // !change get skipped
					completed: false,
					comment: null,
					open: categories.questions ? categories.questions.visible : false,
					category: 'questions',
					item: {
						answer_options: answer_options,
						segment: questionSegment,
						translation: '',
						language: userLanguage,
						form: form,
						variable_id: variableId,
						section: section
					} satisfies QuestionItem
				};

				if (!translationsByVariableId[variableId]) {
					translationsByVariableId[variableId] = [];
				}
				translationsByVariableId[variableId].push(translation);
			}
		});

		// Process Answer segments
		for (const [questionSegment, questionSegmentData] of Object.entries(questionSegments)) {
			const variableId = questionSegmentData.variableId;
			const answer_options = $state.snapshot(questionSegmentData.answer_options);

			if (answer_options == null) continue; // Now break works!

			for (const answer_option of answer_options) {
				const segmentData = $state.snapshot(answerSegments[answer_option]);
				let translated = false;
				for (const translation in segmentData.translations) {
					if (segmentData.translations[translation].user_created == userId) {
						translated = true;
						const oldTranslation: ForwardTranslation = {
							table: 'answer_options', // Changed from 'completion_guides' to 'definitions'
							skipped: false, // !change get skipped
							completed: true,
							comment: null, // !change get comment
							open: false, //categories.questions ? categories.questions.visible : false,
							category: 'answers',
							item: {
								segment: answer_option,
								translation: segmentData.translations[translation].translation,
								language: userLanguage
							} satisfies BaseItem
						};

						if (!translationsByVariableId[variableId]) {
							translationsByVariableId[variableId] = [];
						}

						translationsByVariableId[variableId].push(oldTranslation);
					}
				}
				if (!translated) {
					const translation: ForwardTranslation = {
						table: 'answer_options', // Changed from 'completion_guides' to 'definitions'
						skipped: false, // !change get skipped
						completed: false,
						comment: null,
						open: categories.answers ? categories.answers.visible : false,
						category: 'answers',
						item: {
							segment: answer_option,
							translation: '',
							language: userLanguage
						} satisfies BaseItem
					};

					if (!translationsByVariableId[variableId]) {
						translationsByVariableId[variableId] = [];
					}
					translationsByVariableId[variableId].push(translation);
				}
			}
		}

		Object.entries(definitionSegments).forEach(([definitionSegment, segmentData]) => {
			const variableId = segmentData.variableId;

			let translated = false;

			for (const translation in segmentData.translations) {
				console.log('comment', segmentData.translations[translation].comment);
				if (segmentData.translations[translation].user_created == userId) {
					translated = true;
					const oldTranslation: ForwardTranslation = {
						table: 'definitions', // Changed from 'completion_guides' to 'definitions'
						skipped: false, // !change get skipped
						completed: true,
						comment: segmentData.translations[translation].comment, // !change get comment
						open: false, // categories.definitions ? categories.definitions.visible : false,
						category: 'definitions',
						item: {
							segment: definitionSegment,
							translation: segmentData.translations[translation].translation,
							language: userLanguage,
							form: form,
							variable_id: variableId,
							section: section
						} satisfies GuideItem
					};

					if (!translationsByVariableId[variableId]) {
						translationsByVariableId[variableId] = [];
					}
					translationsByVariableId[variableId].push(oldTranslation);
				}
			}
			if (!translated) {
				const translation: ForwardTranslation = {
					table: 'definitions', // Changed from 'completion_guides' to 'definitions'
					skipped: false, // !change get skipped
					completed: false,
					comment: null,
					open: categories.definitions ? categories.definitions.visible : false,
					category: 'definitions',
					item: {
						segment: definitionSegment,
						translation: '',
						language: userLanguage,

						form: form,
						variable_id: variableId,
						section: section
					} satisfies GuideItem
				};

				if (!translationsByVariableId[variableId]) {
					translationsByVariableId[variableId] = [];
				}
				translationsByVariableId[variableId].push(translation);
			}
		});

		// Process guide segments
		Object.entries(guideSegments).forEach(([guideSegment, segmentData]) => {
			const variableId = segmentData.variableId;

			let translated = false;
			for (const translation in segmentData.translations) {
				if (segmentData.translations[translation].user_created == userId) {
					translated = true;
					const oldTranslation: ForwardTranslation = {
						table: 'completion_guides', // Changed from 'completion_guides' to 'definitions'
						skipped: false, // !change get skipped
						completed: true,
						comment: null, // !change get comment
						open: false, // categories.definitions ? categories.definitions.visible : false,
						category: 'completion_guides',
						item: {
							segment: guideSegment,
							translation: segmentData.translations[translation].translation,
							language: userLanguage,
							form: form,
							variable_id: variableId,
							section: section
						} satisfies GuideItem
					};

					if (!translationsByVariableId[variableId]) {
						translationsByVariableId[variableId] = [];
					}
					translationsByVariableId[variableId].push(oldTranslation);
				}
			}

			if (!translated) {
				const translation: ForwardTranslation = {
					table: 'completion_guides', // Changed from 'completion_guides' to 'definitions'
					skipped: false, // !change get skipped
					completed: false,
					comment: null,
					open: categories.completion_guides ? categories.completion_guides.visible : false,
					category: 'completion_guides',
					item: {
						segment: guideSegment,
						translation: '',
						language: userLanguage,
						form: form,
						variable_id: variableId,
						section: section
					} satisfies GuideItem
				};

				if (!translationsByVariableId[variableId]) {
					translationsByVariableId[variableId] = [];
				}
				translationsByVariableId[variableId].push(translation);
			}
		});

		return translationsByVariableId;
	});
</script>

{#if loadedStatus.arc}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
		class="w-full"
	>
		<div class="pt-1 pb-4">
			<div class="text-lg flex justify-center">
				{#each forms as form}
					<label
						class=" hover:underline cursor-pointer px-2 rounded-full {currentForm == form
							? '  '
							: 'opacity-50 '}"
					>
						<input class="" type="radio" name="currentForm" value={form} bind:group={currentForm} />
						<span class="mr-2">{form}</span>
					</label>
				{/each}
			</div>
		</div>
		<div class="flex w-full justify-center space-x-4 px-20 pb-5 flex-wrap">
			{#each Object.entries(categories) as [category, config]}
				<ToggleSwitch
					label={config.label}
					bind:value={config.visible}
					onChange={() => {
						if (forwardTranslationsFormRef) {
							forwardTranslationsFormRef.filterData(category, config.visible);
						}
					}}
				/>
			{/each}
		</div>

		<hr class="border-stone-700 dark:border-stone-600" />
		{#if currentForm == 'Forward Translate'}
			<div in:fly={{ x: -40, duration: 200, delay: 100 }} out:fly={{ x: -40, duration: 100 }}>
				<ForwardTranslationsForm {forwardTranslations} bind:this={forwardTranslationsFormRef} />
			</div>
		{:else if currentForm == 'Backward Translate'}
			<div in:fly={{ x: 40, duration: 200, delay: 100 }} out:fly={{ x: 40, duration: 100 }}>
				Nothing to backward translate
			</div>
		{:else}
			<div in:fly={{ x: 40, duration: 200, delay: 100 }} out:fly={{ x: 40, duration: 100 }}>
				Nothing to review
			</div>
		{/if}
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
