import type { TranslationLanguage } from '$lib/types';
import { supabase } from '../../supabaseClient';
import type { TranslationProgressRow } from './types';

export async function pullTranslationProgressForVerification(language: TranslationLanguage) {
	const translations: Array<TranslationProgressRow> = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		const { data, error: fetchError } = await supabase
			.from('translation_progress')
			.select('*')
			.eq('language', language)
			.range(page * pageSize, (page + 1) * pageSize - 1);

		if (fetchError) {
			console.error('Error fetching existing translations:', fetchError);
			return [];
		}

		if (data) {
			translations.push(...data);
			hasMore = data.length === pageSize;
			page++;
		} else {
			hasMore = false;
		}
	}

	return translations;
}

export async function pullTranslationProgressForSegments(
	language: TranslationLanguage,
	segmentIds: number[]
) {
	console.log('01 pullTranslationProgressForSegments', segmentIds.length);
	const translations: Array<TranslationProgressRow> = [];
	const batchSize = 1000; // segmentIDs
	const pageSize = 1000;

	// Create a set of remaining IDs to check
	const remainingIds = new Set(segmentIds);

	// Process in batches
	for (let batchStart = 0; batchStart < segmentIds.length; batchStart += batchSize) {
		const batchIds = segmentIds.slice(batchStart, batchStart + batchSize);

		// Filter to only IDs we haven't found yet
		const idsToCheck = batchIds.filter((id) => remainingIds.has(id));

		if (idsToCheck.length === 0) continue;

		let page = 0;
		let hasMore = true;

		while (hasMore) {
			const { data, error: fetchError } = await supabase
				.from('translation_progress')
				.select('*')
				.eq('language', language)
				.in('original_id', idsToCheck)
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (fetchError) {
				console.error('Error fetching existing translations:', fetchError);
				return [];
			}

			if (data) {
				translations.push(...data);
				data.forEach(row => remainingIds.delete(row.original_id));
				hasMore = data.length === pageSize;
				page++;
			} else {
				hasMore = false;
			}
		}
		// Early exit if we've found all IDs
		if (remainingIds.size === 0) break;
	}

	console.log('02 pullTranslationProgressForSegments', translations.length);
	return translations;
}
