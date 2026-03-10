import { pullOriginalSegments } from '$lib/supabase/originalTranslations';
import type {
	AcceptedTranslationRow,
	ForwardTranslationRow,
	OriginalSegmentRow,
	TranslationProgressRow,
	TranslationReviewRow
} from '$lib/supabase/types';
import { pullRowsForOriginalId } from '$lib/supabase/utils';

export type LinkSegments = Record<
	number, // original_id
	OriginalSegmentRow
>;

export type LinkTranslationData = Record<
	string, // language
	Record<
		number, // original_id
		{
			translationProgress?: TranslationProgressRow;
			forwardTranslations?: ForwardTranslationRow[];
			translationReviews?: TranslationReviewRow[];
			acceptedTranslations?: AcceptedTranslationRow[];
		}
	>
>;

export type LinkStructure = [LinkSegments, LinkTranslationData];

// == == Pull LINK for version == == //
// @ optional "version" and "set" later (when we have a new database to store each )
export const pullLink = async (version: string): Promise<LinkStructure> => {
	// = ( 1 ) = pull original segments
	console.log('Pulling LINK; get original segments');
	const originalSegmentList = await pullOriginalSegments(version);
	// * map to id
	const originalSegments: Record<number, OriginalSegmentRow> = Object.fromEntries(
		originalSegmentList.map((segment) => [segment.id, segment])
	);

	// = ( 2 ) = promise.all -> accepted_translations, forward_translations, translation_reviews, translation_progress.
	console.log('Pulling LINK; get all tables');
	const segmentIds: number[] = Object.keys(originalSegments).map(Number);
	const [translation_progress, forward_translations, translation_reviews, accepted_translations] =
		await Promise.all([
			pullRowsForOriginalId<TranslationProgressRow>('translation_progress', segmentIds),
			pullRowsForOriginalId<ForwardTranslationRow>('forward_translations', segmentIds),
			pullRowsForOriginalId<TranslationReviewRow>('translation_reviews', segmentIds),
			pullRowsForOriginalId<AcceptedTranslationRow>('accepted_translations', segmentIds)
		]);

	// + Init link for export
	const LINK: LinkTranslationData = {};

	// * Get translation_progress for this item
	for (const progress of translation_progress) {
		const lang = progress.language;
		const oID = progress.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		LINK[lang][oID] = { translationProgress: progress };
	}

	// * Get Forward Translations
	for (const translation of forward_translations) {
		const lang = translation.language;
		const oID = translation.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		if (!LINK[lang][oID]) LINK[lang][oID] = {};
		if (!LINK[lang][oID].forwardTranslations) LINK[lang][oID].forwardTranslations = [translation];
		else LINK[lang][oID].forwardTranslations.push(translation);
	}

	// * Get Translation Reviews
	for (const review of translation_reviews) {
		const lang = review.language;
		const oID = review.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		if (!LINK[lang][oID]) LINK[lang][oID] = {};
		if (!LINK[lang][oID].translationReviews) LINK[lang][oID].translationReviews = [review];
		else LINK[lang][oID].translationReviews.push(review);
	}

	// * Get Accepted Translations
	for (const accTranslation of accepted_translations) {
		const lang = accTranslation.language;
		const oID = accTranslation.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		if (!LINK[lang][oID]) LINK[lang][oID] = {};
		if (!LINK[lang][oID].acceptedTranslations)
			LINK[lang][oID].acceptedTranslations = [accTranslation];
		else LINK[lang][oID].acceptedTranslations.push(accTranslation);
	}

	// == return entire LINK results in LinkStructure with original segments == //
	const link: LinkStructure = [originalSegments, LINK];
	return link;
};
