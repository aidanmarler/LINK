<script lang="ts">
	import { paginateQuery } from '$lib/supabase/utils';
	import { onMount } from 'svelte';
	import { supabase } from '../../../supabaseClient';
	import AdminTable from './adminTable.svelte';

	/*
        On start: pull all Profiles, Documents, Original Segments, accepted_translations, and translation_progress

        Question... How long to just pull EVERYTHING?
        From accepted 
    */

	let tables: Record<string, null | Record<string, unknown>[]> = $state({});

	onMount(async () => {
		//const startTime = performance.now();
		console.log('Start PullLinkForReview');
		const [
			profiles,
			documents,
			original_segments
			/*accepted_translations,
			translation_progress,
			forward_translations,
			translation_reviews*/
		] = await Promise.all([
			paginateQuery(supabase.from('profiles').select('*'), 1000, 'profiles'),
			paginateQuery(supabase.from('documents').select('*'), 1000, 'documents'),
			paginateQuery(supabase.from('original_segments').select('*'), 1000, 'original_segments')
			/*
			paginateQuery(
				supabase.from('accepted_translations').select('*'),
				1000,
				'accepted_translations'
			),
			paginateQuery(
				supabase.from('translation_progress').select('*'),
				1000,
				'translation_progress'
			),
			paginateQuery(
				supabase.from('forward_translations').select('*'),
				1000,
				'forward_translations'
			),
			paginateQuery(supabase.from('translation_reviews').select('*'), 1000, 'translation_reviews')*/
		]);

		tables.profiles = profiles.data;
		tables.documents = documents.data;
		tables.original_segments = original_segments.data;
		//tables.original_segments = original_segments.data;
		//tables.translation_progress = translation_progress.data;
	});
</script>

{#each Object.entries(tables) as [name, table]}
	{#if table}
		<AdminTable {name} {table} />
	{/if}
{/each}
