<script lang="ts">
	import { page } from '$app/state';
	import {
		addressBook,
		formTableTree,
		global_address,
		loadedStatus,
		reset_address,
		sectionTableTree
	} from '$lib/global.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { ForwardTranslation, LabelAddress, LabelItem, UserForm } from '$lib/types';
	import ForwardTranslationsForm from '../../../../components/forms/forwardTranslationsForm.svelte';

	let currentForm: UserForm = $state('Forward Translate');
	let forms: UserForm[] = ['Forward Translate', 'Review', 'Backward Translate'];

	let form = $derived(page.url.pathname.split('/').filter(Boolean)[2]);

	// svelte-ignore non_reactive_update
	let forwardTranslationsFormRef: ForwardTranslationsForm;

	let sectionLabels = $derived(sectionTableTree.data.forms[form].segments);

	let forwardTranslations: Record<string, ForwardTranslation[]> = $derived.by(() => {
		if (!formTableTree.data || !sectionTableTree.data) return {};

		let formSegment = Object.entries(formTableTree.data.forms[form].segments)[0][0];
		let sectionLabels: ForwardTranslation[] = Object.entries(
			sectionTableTree.data.forms[form].segments
		).map(
			([sectionSegment]) =>
				({
					table: 'sections',
					skipped: false,
					comment: null,
					open: true,
					completed: false,
					item: {
						segment: sectionSegment, // This is the equivalent of formSegment for sections
						translation: '',
						language: 'spanish',
						form: addressBook.forms[form].branch.id
					} as LabelItem
				}) as ForwardTranslation
		);

		
		let translations: Record<string, ForwardTranslation[]> = {
			'Form Label': [
				{
					table: 'forms',
					skipped: false,
					comment: null,
					category: 'lists',
					open: true,
					completed: false,
					item: {
						segment: formSegment,
						translation: '',
						language: 'spanish',

						form: addressBook.forms[form].branch.id
					} as LabelItem
				}
			],
			'Section Labels': sectionLabels
		};

		return translations;
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
