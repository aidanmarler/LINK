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
	import type { ForwardTranslation, LabelAddress, LabelItem } from '$lib/types';
	import ForwardTranslationsForm from '../../../../components/forms/forwardTranslationsForm.svelte';

	let form = $derived(page.url.pathname.split('/').filter(Boolean)[2]);

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

{#if loadedStatus.lists && formTableTree.data}
	<div
		in:fly|global={{ x: 10, duration: 200, delay: 100 }}
		out:fly|global={{ x: -10, duration: 100 }}
		class="w-full"
	>
		<div class="flex rounded-full justify-center">
			<div class="text-lg text-white font-medium italic">
				<button class="bg-black rounded-l-full px-5 cursor-pointer"> Forward Translate </button>
				<button class="bg-black opacity-40 px-5 cursor-pointer"> Review </button>
				<button class="bg-black opacity-40 rounded-r-full px-5 cursor-pointer">
					Back Translate
				</button>
			</div>
		</div>
		<ForwardTranslationsForm {forwardTranslations} />
	</div>
{:else}
	<div class="w-32 h-32">loading...</div>
{/if}
