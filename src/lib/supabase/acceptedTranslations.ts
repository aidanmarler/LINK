import type { TranslationLanguage } from '$lib/types';
import { supabase } from '../../supabaseClient';
import type {
	AcceptedTranslationInsert,
	AcceptedTranslationRow,
	ForwardTranslationRow
} from './types';

// New helper function to pull forward translations once
export async function pullAcceptedTranslationsForAcceptedVerification(
	language: TranslationLanguage
) {
	const translations: Array<AcceptedTranslationRow> = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		const { data, error: fetchError } = await supabase
			.from('accepted_translations')
			.select('*')
			.eq('language', language)
			.eq('currently_accepted', true)
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

// Get Forward Translations for given segments
export async function pullAcceptedTranslationForSegments(
	language: TranslationLanguage,
	segmentIds: number[]
) {
	console.log('01 pullForwardTranslationsForSegments', segmentIds.length);
	const translations: Array<ForwardTranslationRow> = [];
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
				.from('forward_translations')
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
				data.forEach((row) => remainingIds.delete(row.original_id));
				hasMore = data.length === pageSize;
				page++;
			} else {
				hasMore = false;
			}
		}
		// Early exit if we've found all IDs
		if (remainingIds.size === 0) break;
	}

	console.log('02 pullForwardTranslationsForSegments', translations.length);
	return translations;
}

export async function InsertAcceptedTranslation(acceptedTranslations: AcceptedTranslationInsert[]) {
	const { error: insertError } = await supabase
		.from('accepted_translations')
		.insert(acceptedTranslations);
	if (insertError) return insertError;
	return;
}
