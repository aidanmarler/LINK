/*

1. On load a forward segment, first find any and all exact matches with translations with a score of at least 2 (1 human). 

2. For each that you find, check for the one with the best translation (highest score) and push that.

3. If no exact matches found, find the top 5 most similar segments that have translations with minumum score of 2.

4. Show them in order of closesness of fit with 


... To show a translation:
it shouldn't be suggested if unreviewed AI.
it shouldn't be suggested if unreviewed Human.

Only suggest translation if it is YOUR unreviewed translation, you get special permission.
Or if translation is accepted with at least score of 2.

*/

import type { FindSimilarSegmentsResult, PromiseSuggestions } from '$lib/types';
import { supabase } from '../../../../../supabaseClient';

export async function getSuggestedTranslations(
	ids: number[],
	profileId: string
): PromiseSuggestions {
	const calls = ids.map((id) =>
		supabase.rpc('find_similar_segments', {
			p_segment_id: id,
			p_user_id: profileId,
			min_accepted_score: 0
		})
	);

	const results = await Promise.all(calls);

	const data: Record<number, FindSimilarSegmentsResult> = Object.fromEntries(
		ids.map((id, index) => [id, results[index].data ?? []])
	);

	return data;
}

export async function getSuggestedTranslation(id: number, profileId: string) {
	return await supabase.rpc('find_similar_segments', {
		p_segment_id: id,
		p_user_id: profileId,
		min_accepted_score: 0
	});
}
