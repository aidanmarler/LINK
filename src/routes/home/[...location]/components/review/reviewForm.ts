import { invalidateAll } from '$app/navigation';
import { UpdateProgress_ForwardSubmission } from '$lib/supabase/translationProgress';
import type {
	ForwardTranslationInsert,
	ForwardTranslationRow,
	RelatedTranslations,
	TranslationReviewInsert
} from '$lib/supabase/types';
import {
	InsertForwardTranslations,
	InsertTranslationReviews,
	pullRowsForOriginalId
} from '$lib/supabase/utils';
import type { Profile, TranslationLanguage } from '$lib/types';

// Get and map related translations
export async function getRelatedTranslations(
	original_ids: number[],
	language: TranslationLanguage
): Promise<RelatedTranslations> {
	const relatedTranslations: RelatedTranslations = {};
	const RelatedTranslationsList: ForwardTranslationRow[] = await pullRowsForOriginalId(
		language,
		'forward_translations',
		original_ids
	);

	// map list to relatedTranslations type (id -> text -> row)
	for (const ft of RelatedTranslationsList) {
		if (!ft.translation) continue;
		const id = ft.original_id;
		const trans = ft.translation;

		if (relatedTranslations[id]) {
			if (relatedTranslations[id][trans]) {
				relatedTranslations[id][trans].push(ft);
			} else {
				relatedTranslations[id][trans] = [ft];
			}
		} else relatedTranslations[id] = { [trans]: [ft] };
	}
	return relatedTranslations;
}

// utility; count comment as complete if null is not 0
export function countComments(comments: Record<number, string | null>) {
	let complete = 0;
	for (const c of Object.values(comments)) if (c) complete += 1;
	return complete;
}

export async function handleSubmit(
	reviewsToPush: Record<
		number,
		{
			translation_id: number | string | null;
			comments: Record<number, string | null>;
			ftranslation: string | null;
			fcomment: string | null;
		}
	>,
	profile: Profile
) {
	const cleanedReviews: Record<
		number,
		{
			translation_id: number | null;
			comments: Record<number, string | null>;
			ftranslation: string | null;
			fcomment: string | null;
		}
	> = {};

	const errors: Record<number, string> = {};

	for (const id in reviewsToPush) {
		// Initialize
		cleanedReviews[+id] = {
			translation_id: null,
			comments: {},
			fcomment: null,
			ftranslation: null
		};

		// Handle Comments
		cleanedReviews[+id].comments = reviewsToPush[+id].comments;

		// If translation id is a number, we know they selected one
		if (typeof reviewsToPush[+id].translation_id == 'number') {
			cleanedReviews[+id].translation_id = Number(reviewsToPush[+id].translation_id);
		}

		// Otherwise, if translation id is a string, we know they are trying to submit one
		if (typeof reviewsToPush[+id].translation_id == 'string') {
			const noComment =
				reviewsToPush[+id].fcomment == null || reviewsToPush[+id].fcomment?.trim() == '';
			const noTranslation =
				reviewsToPush[+id].ftranslation == null || reviewsToPush[+id].ftranslation?.trim() == '';
			if (noComment && noTranslation) errors[+id] = 'No translation or justification provided';
			else if (noComment) errors[+id] = 'No justification provided';
			else if (noTranslation) errors[+id] = 'No translation provided';
			else {
				cleanedReviews[+id].ftranslation = reviewsToPush[+id].ftranslation;
				cleanedReviews[+id].fcomment = reviewsToPush[+id].fcomment;
			}
		}
	}
	console.log(reviewsToPush, cleanedReviews, errors);
	const newTranslations: ForwardTranslationInsert[] = [];
	const newReviews: TranslationReviewInsert[] = [];

	/* 
		To submit a translation review... get:
		 1) reviews to insert
		 2) forward translations to insert
		 3) reviews to update
		*/

	// Organize translation to push
	for (const id in cleanedReviews) {
		// If there is a translation_id
		if (cleanedReviews[id].translation_id) {
			newReviews.push({
				original_id: +id,
				reviewer_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation_id: cleanedReviews[id].translation_id,
				comments: cleanedReviews[id].comments
			});
		}
		// If a forward translation, add that
		else if (cleanedReviews[id].ftranslation) {
			newReviews.push({
				original_id: +id,
				reviewer_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation_id: null,
				comments: cleanedReviews[id].comments
			});
			newTranslations.push({
				original_id: Number(id),
				user_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation: cleanedReviews[id].ftranslation ?? '',
				comment: cleanedReviews[id].fcomment ?? undefined,
				skipped: false
			});
		}
	}

	console.log('newTranslations', newTranslations);
	console.log('newReviews', newReviews);

	// Insert new translations to supabase ForwardTranslations table
	if (newTranslations.length > 0) await InsertForwardTranslations(newTranslations);
	if (newTranslations.length > 0) await UpdateProgress_ForwardSubmission(newTranslations);
	if (newReviews.length > 0) await InsertTranslationReviews(newReviews);

	// Update progress and reset app
	if (newTranslations.length > 0 || newReviews.length > 0) {
		await invalidateAll();
	}

	return errors;
}
