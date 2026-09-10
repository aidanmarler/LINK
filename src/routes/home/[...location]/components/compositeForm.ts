import type {
	ForwardTranslationInsert,
	ForwardTranslationRow,
	SegmentData,
	SegmentMap,
	TranslationReviewInsert,
	TranslationReviewRow
} from '$lib/supabase/types';
import type { Profile, TranslationLanguage } from '$lib/types';
import _ from 'lodash';

// MARK: - Types
export type TranslationVariables = {
	translation: string;
	comment: string;
	skipped: boolean;
};

export const blankTranslationVariables = (): TranslationVariables => {
	return {
		translation: '',
		comment: '',
		skipped: false
	};
};

// T: How we store existing and modified page data
export type PageForward = Record<number, TranslationVariables>;
export type PageReview = Record<
	number,
	{
		translation_id: number | string | null;
		comments: Record<number, string | null>;
		ftranslation: string | null;
		fcomment: string | null;
	}
>;
export type PageAccepted = Record<number, string>;

// T: Create Page Translations, to store Page Data
export type PageTranslations = {
	forwardPush: PageForward;
	forwardEdit: PageForward;
	forwardLocked: number[];
	reviewPush: PageReview;
	reviewEdit: number[];
	reviewLocked: number[];
	accepted: PageAccepted;
};

export const blankPageTranslations = (): PageTranslations => {
	return {
		forwardPush: {},
		forwardEdit: {},
		forwardLocked: [],
		reviewPush: {},
		reviewEdit: [],
		reviewLocked: [],
		accepted: {}
	};
};

// T: Create Page Submissions, to store cleaned page data
export type PageSubmissions = {
	forwardPush: ForwardTranslationInsert[];
	forwardEdit: ForwardTranslationRow[];
	reviewPush: TranslationReviewInsert[];
	reviewEdit: TranslationReviewRow[];
};

export type SegmentsEditing = Record<number, boolean>;

export const blankPageSubmissions = (): PageSubmissions => {
	return {
		forwardPush: [],
		forwardEdit: [],
		reviewPush: [],
		reviewEdit: []
	};
};

// MARK: - Helpers
// & Initialize Page Translation structure using all data for page segments
export function initPageTranslations(
	userData: SegmentMap,
	//relatedTranslations: RelatedTranslations,
	relatedReviews: Record<number, TranslationReviewRow[]>
): [PageTranslations, SegmentsEditing] {
	const page: PageTranslations = blankPageTranslations();
	const segmentsEditing: SegmentsEditing = {};
	for (const [id, segmentData] of Object.entries(userData)) {
		const prog = segmentData.translationProgress;
		const inForward = !prog || (prog && prog.translation_step == 'forward');
		const inReview = prog && prog.translation_step == 'review';
		const reviews = relatedReviews[+id];

		// If in forward and nothing pushed, init new push
		if (inForward && segmentData.forwardTranslation == null) {
			page.forwardPush[+id] = { translation: '', comment: '', skipped: false };
			continue;
		}

		if (segmentData.forwardTranslation) {
			const reviewedTranslations: Set<number> = reviews
				? new Set(
						reviews.flatMap((r) => Object.keys(r.comments as Record<number, unknown>).map(Number))
					)
				: new Set();
			const reviewed: boolean = (+id) in reviewedTranslations;

			// If something pushed, but no reviewed, allow edit
			if (!reviewed) {
				//console.log("Forward Edit! ", segmentData.forwardTranslation, reviewed)
				segmentsEditing[+id] = false;
				page.forwardEdit[+id] = { translation: '', comment: '', skipped: false };
				continue;
			}

			// If something pushed and reviewed, lock from interaction
			else if (reviewed && inForward) {
				//console.log("Forward Locked! ", segmentData.forwardTranslation, reviewed)

				page.forwardLocked.push(+id);
				continue;
			}
		}

		// If in review
		if (inReview) {
			if (segmentData.translationReview == null) {
				page.reviewPush[+id] = {
					translation_id: null,
					comments: {},
					fcomment: null,
					ftranslation: null
				};
				continue;
			}

			const myReview = segmentData.translationReview;
			const newestReview: boolean = reviews.every((r) => r.created_at < myReview.created_at);

			// If newest review, allow edit
			if (newestReview) {
				page.reviewEdit.push(+id);
				continue;
			}

			// If newer review, lock from interaction
			page.reviewLocked.push(+id);
			continue;
		}

		// If in adjucation
		if (prog && prog.translation_step == 'adjudication') {
			console.warn('Get Best Translation');
			page.accepted[+id] = 'best translation';
			continue;
		}
	}

	return [page, segmentsEditing];
}

// & Given a segment id, get which form it populates with ( forwardPush et al. )
export function getCompositeForm(pageTranslations: PageTranslations, id: number) {
	for (const key of Object.keys(pageTranslations) as (keyof PageTranslations)[]) {
		const value = pageTranslations[key];
		if (Array.isArray(value)) {
			if (value.includes(id as number)) return key;
		} else {
			if (id in value) return key;
		}
	}
	//console.log('getCompositeForm undefined', id, pageTranslations);
	return undefined;
}

// MARK: - Submission
export function transformPageForSubmission(
	page: PageTranslations,
	segments: [number, SegmentData][],
	segmentsEditing: SegmentsEditing,
	profile: Profile
) {
	console.log('transforPageForSubmission segments:', segments);
	const submissions: PageSubmissions = blankPageSubmissions();

	const handleForwardPush = () => {
		const newForwardTranslations: ForwardTranslationInsert[] = [];

		// Organize translation to push
		for (const id in page.forwardPush) {
			// Skip Translations if skip is pressed
			if (page.forwardPush[id].skipped == true) {
				newForwardTranslations.push({
					original_id: Number(id),
					user_id: profile.id,
					language: profile.language as TranslationLanguage,
					translation: '',
					comment: page.forwardPush[id].comment,
					skipped: page.forwardPush[id].skipped
				});
			}

			// Ignore if no text data
			if (page.forwardPush[id].translation == '' || !page.forwardPush[id].translation) continue;

			// New Translation
			newForwardTranslations.push({
				original_id: Number(id),
				user_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation: page.forwardPush[id].translation.trim(),
				comment: page.forwardPush[id].comment.trim(),
				skipped: page.forwardPush[id].skipped
			});
		}

		return newForwardTranslations;
	};

	const handleForwardEdit = () => {
		const newForwardEdits: ForwardTranslationRow[] = [];
		const blank = blankTranslationVariables();
		for (const [id, d] of Object.entries(page.forwardEdit)) {
			if (_.isEqual(d, blank)) continue;
			if (!segmentsEditing[+id]) continue;
			const segment = segments.find((s) => s[0] == +id);
			if (!segment) continue;
			const submitted = segment[1].forwardTranslation;
			if (!submitted) continue;
			//console.log('comment', submitted.comment, d.comment);
			if (submitted.translation != d.translation) {
				console.log('translation', 'og: ' + submitted.translation, 'new: ' + d.translation);
			}
			if (submitted.comment != d.comment) {
				console.log('comment', submitted.comment, d.comment);
			}
			if (submitted.skipped != d.skipped) {
				console.log('skipped', submitted.skipped, d.skipped);
			}
			const editRow: ForwardTranslationRow = { ...submitted };
			if (d.skipped) {
				editRow.skipped = true;
				editRow.translation = null;
				editRow.comment = d.comment;
			} else {
				editRow.skipped = false;
				editRow.translation = d.translation;
				editRow.comment = d.comment;
			}

			if (
				editRow.translation == submitted.translation &&
				editRow.comment == submitted.comment &&
				editRow.skipped == submitted.skipped
			)
				continue;
			newForwardEdits.push(editRow);
		}
		return newForwardEdits;
	};

	const handleReviewPush = () => {
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
		for (const [id, r] of Object.entries(page.reviewPush)) {
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

			//console.log('commentAdded', commentAdded);

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

		/*
		console.log('  page.reviewPush', page.reviewPush);
		console.log('  filteredReviews', filteredReviews);
		console.log('  cleanedReviews', cleanedReviews);
		console.log('  errors', errors);
		*/

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

		//console.log('  errors', errors);

		if (Object.values(errors).length > 0) {
			console.warn("sorry, won't submit with errors");
			//return errors;
		}

		return { newTranslations: newTranslations, newReviews: newReviews, errors: errors };
	};

	// Handle adding page pushes
	const forwardPushData = handleForwardPush();
	const forwardEditData = handleForwardEdit();
	const reviewPushData = handleReviewPush();
	submissions.forwardPush.push(...forwardPushData);
	submissions.forwardEdit.push(...forwardEditData);
	submissions.forwardPush.push(...reviewPushData.newTranslations);
	submissions.reviewPush.push(...reviewPushData.newReviews);
	return submissions;
}

//
export async function handlePageTranslationSubmission(page: PageSubmissions, _profile: Profile) {
	console.log('PageSubmissions:', page);
	/*
	const translationInserts: ForwardTranslationInsert[] = [];
	const translationUpdates: ForwardTranslationRow[] = [];
	const reviewInserts: TranslationReviewInsert[] = [];
	const reviewUpdates: TranslationReviewRow[] = [];

	// Filter to new pushes, rather than changed.
	// Filter to edited sumbitted translations.
	// Format

	// Organize translation to push
	for (const id in page.forwardPush) {
		// Skip Translations if skip is pressed
		if (page.forwardPush[id].skipped == true) {
			translationInserts.push({
				original_id: Number(id),
				user_id: profile.id,
				language: profile.language as TranslationLanguage,
				translation: '',
				comment: page.forwardPush[id].comment,
				skipped: page.forwardPush[id].skipped
			});
		}

		// Ignore if no text data
		if (DEPtranslationsToPush[id].translation == '') continue;

		// New Translation
		translationInserts.push({
			original_id: Number(id),
			user_id: profile.id,
			language: profile.language as TranslationLanguage,
			translation: DEPtranslationsToPush[id].translation.trim(),
			comment: DEPtranslationsToPush[id].comment.trim(),
			skipped: DEPtranslationsToPush[id].skipped
		});
	}

	if (translationInserts.length > 0) {
		loading.message = 'Pushing translation...';
		loading.active = true;
		// Insert new translations to supabase ForwardTranslations table
		await InsertForwardTranslations(translationInserts);

		// Handle check translation progress for submitted translations
		await UpdateProgress_ForwardSubmission(translationInserts, 'forward');

		// Invalidate data so that it reloads current data.
		//await invalidateAll();
		await invalidate('app:data');
	}
		*/
}
