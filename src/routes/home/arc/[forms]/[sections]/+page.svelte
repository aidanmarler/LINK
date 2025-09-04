<script lang="ts">
	import { page } from '$app/state';
	import {
		addressBook,
		definitionTableTree,
		formTableTree,
		global_address,
		guideTableTree,
		loadedStatus,
		reset_address,
		sectionTableTree
	} from '$lib/global.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { ForwardTranslation, LabelAddress, LabelItem } from '$lib/types';
	import ForwardTranslationsForm from '../../../../components/forms/forwardTranslationsForm.svelte';
	import ToggleSwitch from '../../../../components/toggleSwitch.svelte';

	type UserForm = 'Forward Translate' | 'Review' | 'Backward Translate';
	let currentForm: UserForm = $state('Forward Translate');
	let forms: UserForm[] = ['Forward Translate', 'Review', 'Backward Translate'];

	type VariableCategory = 'questions' | 'answers' | 'definitions' | 'completion_guides';

	interface VariableCategoryConfig {
		label: string;
		visible: boolean;
	}

	const categories: Record<VariableCategory, VariableCategoryConfig> = $state({
		questions: {
			label: 'Questions',
			visible: false
		},
		answers: {
			label: 'Answers',
			visible: false
		},
		definitions: {
			label: 'Definitions',
			visible: true
		},
		completion_guides: {
			label: 'Completion Guides',
			visible: true
		}
	});

	let form_nav = $derived(page.url.pathname.split('/').filter(Boolean)[2]);
	let form = $derived(addressBook.forms[form_nav].branch.id);
	let section_nav = $derived(page.url.pathname.split('/').filter(Boolean)[3]);
	let section = $derived(addressBook.forms[form_nav].sections[section_nav].branch.id);

	let forwardTranslations: Record<string, ForwardTranslation[]> = $derived.by(() => {
		if (!guideTableTree.data || !definitionTableTree.data) return {};
		//let guideSegments = Object.entries(guideTableTree.data.forms[form].sections[section].segments)[0][0];
		let guideSegments: ForwardTranslation[] = Object.entries(
			guideTableTree.data.forms[form].sections[section].segments
		).map(
			([guideSegment]) =>
				({
					table: 'completion_guides',
					skipped: false,
					comment: null,
					item: {
						segment: guideSegment, // This is the equivalent of formSegment for sections
						translation: '',
						language: 'spanish',
						form: addressBook.forms[form].branch.id
					} as LabelItem
				}) as ForwardTranslation
		);
		let translations: Record<string, ForwardTranslation[]> = {
			'Completion Guides': guideSegments
		};

		return translations;
	});
</script>

{#if guideTableTree.data?.forms[form].sections[section]}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
		class="w-full"
	>
		<div class="flex w-full justify-center space-x-4 px-20 py-2 flex-wrap">
			{#each Object.entries(categories) as [category, config]}
				<ToggleSwitch label={config.label} value={config.visible} />
			{/each}
		</div>
		<div class="py-5">
			<div class="text-lg flex justify-center">
				{#each forms as form}
					<label
						class=" hover:underline cursor-pointer px-2 rounded-full {currentForm == form
							? ' shadow '
							: 'opacity-50 '}"
					>
						<input
							class="mr-2"
							type="radio"
							name="currentForm"
							value={form}
							bind:group={currentForm}
						/>
						<span class="mr-2">{form}</span>
					</label>
				{/each}
			</div>
		</div>
		<hr class="border-stone-700 dark:border-stone-600" />
		{#if currentForm == 'Forward Translate'}
			<div in:fly={{ x: -40, duration: 200, delay: 100 }} out:fly={{ x: -40, duration: 100 }}>
				<ForwardTranslationsForm {forwardTranslations} />
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
