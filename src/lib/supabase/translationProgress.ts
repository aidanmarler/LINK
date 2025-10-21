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
