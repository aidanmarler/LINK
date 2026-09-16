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

import type { ForwardTranslationRow } from '$lib/supabase/types';
import { supabase } from '../../../../../supabaseClient';

export async function getSuggestedTranslations(
	segmentHash: string,
	segmentId: number
): Promise<ForwardTranslationRow[]> {
	// & get accepted translations for segment ids
	const _getAcceptedTranslations = async (ids: number[]) => {
		const requests = [];
		for (const id of ids) {
			requests.push(supabase.from('accepted_translations').select('first').eq('original_id', id));
		}
		const result = await Promise.all(requests);
		return result;
	};

	const exactMatches = await supabase
		.from('original_segments')
		.select('*')
		.eq('segment_hash', segmentHash)
		.neq('id', segmentId);

	console.log("exactMatches", exactMatches);
	/*
    if (exactMatches.length() > 0) {
        const ids = exactMatches.map((s)=>s.id);
        await getAcceptedTranslations(ids);
    }*/

	return [];
}
