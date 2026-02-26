import { invalidateAll } from '$app/navigation';
import { UpdateProgress_ForwardSubmission } from '$lib/supabase/translationProgress';
import type {
	ForwardTranslationInsert,
	ForwardTranslationRow,
	RelatedTranslations,
	TranslationReviewInsert,
	TranslationReviewRow
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
	userReviews: Record<
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
	// Stored userReview minus ones they didn't fill out
	const filteredReviews: Record<
		number,
		{
			translation_id: number | string | null;
			comments: Record<number, string | null>;
			ftranslation: string | null;
			fcomment: string | null;
		}
	> = {};
	// Cleans reviews for submission
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

	//  ==  Filter Reviews
	//      Skip reviews that had no interaction
	for (const [id, r] of Object.entries(userReviews)) {
		if (
			!r.translation_id &&
			!r.ftranslation &&
			!r.fcomment &&
			Object.values(r.comments).length == 0
		)
			continue;
		filteredReviews[+id] = r;
	}

	// Clean Reviews
	for (const id in filteredReviews) {
		// Initialize
		cleanedReviews[+id] = {
			translation_id: null,
			comments: {},
			fcomment: null,
			ftranslation: null
		};

		// track if comment was added for this review
		let commentAdded = true;
		// clean comments so empty strings are null
		cleanedReviews[+id].comments = filteredReviews[+id].comments;
		for (const [i, c] of Object.entries(cleanedReviews[+id].comments)) {
			if (c == '' || c == null) commentAdded = false;
			if (c == '') cleanedReviews[+id].comments[+i] = null;
		}

		console.log('commentAdded', commentAdded);

		// If translation id is a number, we know they selected one
		if (typeof filteredReviews[+id].translation_id == 'number') {
			cleanedReviews[+id].translation_id = Number(filteredReviews[+id].translation_id);
		}

		// Otherwise, if translation id is a string, we know they are trying to submit one
		if (typeof filteredReviews[+id].translation_id == 'string') {
			const comment =
				filteredReviews[+id].fcomment != null && filteredReviews[+id].fcomment?.trim() != '';
			const translation =
				filteredReviews[+id].ftranslation != null &&
				filteredReviews[+id].ftranslation?.trim() != '';
			//if (noComment && noTranslation) errors[+id] = 'No translation or justification provided';
			//else if (noComment) errors[+id] = 'No justification provided';
			if (!translation && comment) errors[+id] = 'No translation provided';
			else if (!translation && commentAdded) errors[+id] = 'No translation provided';
			else if (translation) {
				cleanedReviews[+id].ftranslation = filteredReviews[+id].ftranslation;
				cleanedReviews[+id].fcomment = filteredReviews[+id].fcomment;
			}
		}

		// Show error if no option selected
		if (filteredReviews[+id].translation_id == null && commentAdded)
			errors[+id] = 'No translation selected';
	}
	console.log(userReviews, filteredReviews, cleanedReviews, errors);
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
				comment: cleanedReviews[id].fcomment ?? '',
				skipped: false
			});
		}
	}

	console.log('newTranslations', newTranslations);
	console.log('newReviews', newReviews);
	console.log('errors', errors);

	if (Object.values(errors).length > 0) {
		console.log("sorry, won't submit with errors");
		return errors;
	}

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

export async function getRelatedReviews(
	original_ids: number[],
	language: TranslationLanguage
): Promise<Record<number, TranslationReviewRow[]>> {
	const relatedReviews: Record<number, TranslationReviewRow[]> = {};
	const RelatedReviewsList: TranslationReviewRow[] = await pullRowsForOriginalId(
		language,
		'translation_reviews',
		original_ids
	);

	// map list to relatedTranslations type (id -> text -> row)
	for (const r of RelatedReviewsList) {
		const id = r.original_id;

		if (relatedReviews[id]) {
			relatedReviews[id].push(r);
		} else relatedReviews[id] = [r];
	}
	return relatedReviews;
}
