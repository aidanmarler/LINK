import type { TranslationLanguage } from '$lib/types';
import { supabase } from '../../supabaseClient';
import type {
	AcceptedTranslationRow,
	ForwardTranslationInsert,
	ForwardTranslationRow,
	RelatedTranslations,
	TranslationProgressInsert,
	TranslationProgressRow
} from './types';
import { getEarliestEvent, InsertTranslationProgress, pullRowsForOriginalId } from './utils';

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
	//console.log('01 pullTranslationProgressForSegments', segmentIds.length);
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

	//console.log('02 pullTranslationProgressForSegments', translations.length);
	return translations;
}

export async function UpdateProgress_ForwardSubmission(
	newForwardTranslations: ForwardTranslationInsert[]
	//segmentMap: SegmentMap
) {
	/*
		Section 1: get relavent data to figure out accepted translations
			- pull all forward translations
			- pull all translation progress
			- pull all accepted translations
	*/

	// step 0 - get original_ids to check
	const translationsToCheckProgress: number[] = [];
	for (const translation of newForwardTranslations) {
		if (translation.skipped) continue;
		translationsToCheckProgress.push(translation.original_id);
	}

	const language = newForwardTranslations[0].language;

	// step 1a - pull all related forward translations
	const relatedForwardTranslations: ForwardTranslationRow[] = await pullRowsForOriginalId(
		language,
		'forward_translations',
		translationsToCheckProgress
	);

	// step 1b - pull all related forward translations
	const relatedTranslationProgress: TranslationProgressRow[] = await pullRowsForOriginalId(
		language,
		'translation_progress',
		translationsToCheckProgress
	);

	// step 1c - pull all related forward translations
	const relatedAcceptedTranslations: AcceptedTranslationRow[] = await pullRowsForOriginalId(
		language,
		'accepted_translations',
		translationsToCheckProgress
	);

	console.log(
		'step 1: related information',
		relatedForwardTranslations,
		relatedTranslationProgress,
		relatedAcceptedTranslations
	);

	/*
		Section 2: map/organize relavent data by original segment's id
	*/

	// group rows them by value in an Object
	// original segment ID -> translation text-> forward translations rows with above text
	const currentTranslations: RelatedTranslations = {};
	// Map translations
	for (const translation of relatedForwardTranslations) {
		// ignore if translation was skipped
		if (translation.skipped || translation.translation == null) continue;

		// get translation location
		const id: number = translation.original_id;
		const text: string = translation.translation;

		// Initialize array of translations, if needed
		if (!currentTranslations[id]) currentTranslations[id] = {};
		if (!currentTranslations[id][text]) currentTranslations[id][text] = [];

		// Translation to Map
		currentTranslations[id][text].push(translation);
	}

	// Map translation progress
	const currentProgress: Record<number, TranslationProgressRow> = {};
	for (const progress of relatedTranslationProgress) {
		const id: number = progress.original_id;
		currentProgress[id] = progress;
	}

	// Map accepted translations
	const currentAcceptedTranslations: Record<number, AcceptedTranslationRow> = {};
	for (const accepted of relatedAcceptedTranslations) {
		const id: number = accepted.original_id;
		currentAcceptedTranslations[id] = accepted;
	}

	console.log('currentTranslations', currentTranslations);
	console.log('currentProgress', currentProgress);
	console.log('currentAcceptedTranslations', currentAcceptedTranslations);

	/*
		Section 3: Identify accepted translation, if we can
	*/

	// Identify which should be the accepted translation
	const acceptedTranslationMap: Record<number, ForwardTranslationRow> = {};
	for (const [id, translation] of Object.entries(currentTranslations)) {
		console.log(id, translation);
		if (Object.keys(translation).length == 1) {
			// get a list of all translations
			const translations: ForwardTranslationRow[] = Object.values(translation)[0];
			// get first translation created, from the list
			const earliestTranslation: ForwardTranslationRow = getEarliestEvent(translations);
			// Set accepted translation for this id to whichever translation is earliest
			acceptedTranslationMap[+id] = earliestTranslation;
			console.log('Only 1 translation!', earliestTranslation);
			continue;
		} else if (Object.keys(translation).length > 1) {
			// if there are multiple choices, rather, choose the one that ever
			continue;
		}
	}

	console.log('acceptedTranslationMap', acceptedTranslationMap);

	/*
	// if only one and count is at least 2
	if (Object.keys(translationCount).length == 1 && Object.values(translationCount)[0] > 1) {
		// Obvious correct
		// Get accepted translation, see if it is this one and set it to this one if not
		//const segmentId = Object.values(translationCount)[0];
		console.log(
			's4 Good Translation!',
			Object.values(translationCount)[0],
			Object.keys(translationCount)[0]
		);
	} else {
		console.log("s4 Not necessarily good translation... let's to go review");
	}*/

	/*
		Section 4: Update accepted translation, if one was found.
	*/

	/*
		Section 5: Set Translation Progress to Review if it is in Forward
	*/
	const progressToUpdate: number[] = [];
	for (const row of Object.values(currentProgress)) {
		if (row.translation_step == 'forward') progressToUpdate.push(row.id);
	}
	// Update translation_progress
	const { error } = await supabase
		.from('translation_progress')
		.update({ translation_step: 'review' })
		.in('id', progressToUpdate);
	if (error) console.error(error);

	console.log('progressToUpdate', progressToUpdate);

	// Check for any new translations to add
	const progressToAdd: number[] = [];
	for (const id of Object.keys(currentTranslations)) {
		if (!Object.keys(currentProgress).includes(id)) {
			progressToAdd.push(+id);
		}
	}
	// Construct their inserts
	const newProgresses: TranslationProgressInsert[] = [];
	for (const id of progressToAdd) {
		const newProgress: TranslationProgressInsert = {
			original_id: id,
			language: language,
			translation_step: 'review'
		};
		newProgresses.push(newProgress);
	}
	// Insert them
	if (newProgresses.length > 0) {
		const insertError = await InsertTranslationProgress(newProgresses);
		if (insertError) console.error(insertError);
	}

	console.log('newProgresses', newProgresses);

	// end! You have updated the relavent translation progresses and accepted translations for these values
	return;

	/*
	FOR REVIEW
	check if obvious winner
		if obvious winner, check accepted translation to see if it is that one, update if not
						 , set translation progress to 'backward'
	*/
}

/*

	BATCH REQUESTS:

	query supabase for all forward_translations of these language|segment pairs (request F1)
	return the best_translation following these metrics:
		1) if there is only , use that one.
		2) if there are 2, one done by a human and one done by a machine, use the human one.
		2) if there is more than one, use the one with the most votes (setting id to earliest translation)

	query supabase for all translation_progresses of these language|segment pairs (request A)
	for all "not found", create a new one, set it to review. (request B)
	for all "forward", set it to review. (request C)


	query supabase for all accepted_translations of these language|segment pairs (request D)
	for all "not found", create a new one, set it to best_translation. (request E)
	for all others, check that it is set to best_translation. (request F)

	*/

// now get all forward translations for these original_id and these translations
/*
	pull related forward translations
	check if there is an obvious winner
		if obvious winner, check accepted translation to see if it is that one.
						 , set translation progress to 'review'
	check if it is split with no winner (tie)
		if tie, set translation progress to 'review'
	*/
