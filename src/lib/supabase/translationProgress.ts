import type { TranslationLanguage } from '$lib/types';
import { supabase } from '../../supabaseClient';
import type { Database } from './database.types';
import type {
	AcceptedTranslationInsert,
	AcceptedTranslationRow,
	ForwardTranslationInsert,
	ForwardTranslationRow,
	RelatedTranslations,
	TranslationProgressInsert,
	TranslationProgressRow,
	TranslationReviewRow
} from './types';
import { InsertTranslationProgress, pullRowsForOriginalId } from './utils';

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
	newForwardTranslations: ForwardTranslationInsert[],
	step: Database['public']['Enums']['TranslationStep']
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

	// * Get all Forward Transalations, Translation Progresses, and Accepted Translations
	const [related_ft, related_tp, related_at, related_tr] = await Promise.all([
		pullRowsForOriginalId<ForwardTranslationRow>(
			'forward_translations',
			translationsToCheckProgress,
			language
		),
		pullRowsForOriginalId<TranslationProgressRow>(
			'translation_progress',
			translationsToCheckProgress,
			language
		),
		pullRowsForOriginalId<AcceptedTranslationRow>(
			'accepted_translations',
			translationsToCheckProgress,
			language
		),
		pullRowsForOriginalId<TranslationReviewRow>(
			'translation_reviews',
			translationsToCheckProgress,
			language
		)
	]);

	/*
		Section 2: map/organize relavent data by original segment's id
	*/

	// group rows them by value in an Object
	// original segment ID -> translation text-> forward translations rows with above text
	const currentTranslations: RelatedTranslations = {};
	// Map translations
	for (const translation of related_ft) {
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
	const currentProgress: Record<number, TranslationProgressRow> = Object.fromEntries(
		related_tp.map((row) => [row.original_id, row])
	);

	/*
		Section 3: Set Translation Progress to Review if it is in Forward
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

	/*
		Section 4: Identify accepted translation, if we can
	*/

	console.log('step 1: related information', related_ft, related_tp, related_at);

	// Store a map of each original_id's acceptted translation and forward and translation reviews
	const relatedMap: Record<
		number,
		{
			at: AcceptedTranslationRow | null;
			ft_array: ForwardTranslationRow[];
			tr_array: TranslationReviewRow[];
		}
	> = {};

	// * map forward translations
	related_ft.map((ft) => {
		if (!relatedMap[ft.original_id])
			relatedMap[ft.original_id] = { at: null, ft_array: [], tr_array: [] };
		relatedMap[ft.original_id].ft_array.push(ft);
	});

	// * map translation reviews
	related_tr.map((tr) => {
		if (!relatedMap[tr.original_id])
			relatedMap[tr.original_id] = { at: null, ft_array: [], tr_array: [] };
		relatedMap[tr.original_id].tr_array.push(tr);
	});

	// * get current accepted translation and return it
	related_at.map((at) => {
		if (!relatedMap[at.original_id])
			relatedMap[at.original_id] = { at: at, ft_array: [], tr_array: [] };
		else {
			const current = relatedMap[at.original_id].at;
			if (!current) {
				relatedMap[at.original_id].at = at;
			} else {
				const c_age = current.created_at;
				const n_age = at.created_at;
				if (n_age > c_age) relatedMap[at.original_id].at = at;
			}
		}
	});

	const atUpserts: (AcceptedTranslationInsert | AcceptedTranslationRow)[] = [];
	for (const [_id, related] of Object.entries(relatedMap)) {
		const at = getAcceptedTranslation(related.at, related.ft_array, related.tr_array, step);
		if (at) atUpserts.push(at);
	}

	console.log('atUpserts', atUpserts);

	const { error: insertError } = await supabase
		.from('accepted_translations')
		.upsert(atUpserts, { onConflict: 'id' });
	if (insertError) return insertError;

	// Identify which should be the accepted translation
	//const acceptedTranslationMap: Record<number, Acc> = {};
	/*
	for (const [id, translation] of Object.entries(currentTranslations)) {
		console.log(id, translation);
		getAcceptedTranslation();
	}*/

	// == end! == You have updated the relavent translation progresses and accepted translations for these values == //
	return;
}

export async function UpdatePATOnSubmission(
	original_ids: number[],
	language: TranslationLanguage,
	step: Database['public']['Enums']['TranslationStep']
) {
	/*
		Section 1: get relavent data to figure out accepted translations
			- pull all forward translations
			- pull all translation progress
			- pull all accepted translations
	*/

	// * Get all Forward Transalations, Translation Progresses, and Accepted Translations
	const [related_ft, related_tp, related_at, related_tr] = await Promise.all([
		pullRowsForOriginalId<ForwardTranslationRow>('forward_translations', original_ids, language),
		pullRowsForOriginalId<TranslationProgressRow>('translation_progress', original_ids, language),
		pullRowsForOriginalId<AcceptedTranslationRow>('accepted_translations', original_ids, language),
		pullRowsForOriginalId<TranslationReviewRow>('translation_reviews', original_ids, language)
	]);

	// Store a map of each original_id's acceptted translation and forward and translation reviews
	const relatedMap: Record<
		number,
		{
			at: AcceptedTranslationRow | null;
			ft_array: ForwardTranslationRow[];
			tr_array: TranslationReviewRow[];
		}
	> = {};

	// * map forward translations
	related_ft.map((ft) => {
		if (!relatedMap[ft.original_id])
			relatedMap[ft.original_id] = { at: null, ft_array: [], tr_array: [] };
		relatedMap[ft.original_id].ft_array.push(ft);
	});

	// * map translation reviews
	related_tr.map((tr) => {
		if (!relatedMap[tr.original_id])
			relatedMap[tr.original_id] = { at: null, ft_array: [], tr_array: [] };
		relatedMap[tr.original_id].tr_array.push(tr);
	});

	// * get current accepted translation and return it
	related_at.map((at) => {
		if (!relatedMap[at.original_id])
			relatedMap[at.original_id] = { at: at, ft_array: [], tr_array: [] };
		else {
			const current = relatedMap[at.original_id].at;
			if (!current) {
				relatedMap[at.original_id].at = at;
			} else {
				const c_age = current.created_at;
				const n_age = at.created_at;
				if (n_age > c_age) relatedMap[at.original_id].at = at;
			}
		}
	});

	async function buildAcceptedTranslations(
		relatedMap: Record<
			number,
			{
				at: AcceptedTranslationRow | null;
				ft_array: ForwardTranslationRow[];
				tr_array: TranslationReviewRow[];
			}
		>
	) {
		console.log('step 1: related information', related_ft, related_tp, related_at);

		const atUpserts: (AcceptedTranslationInsert | AcceptedTranslationRow)[] = [];
		for (const [_id, related] of Object.entries(relatedMap)) {
			const at = getAcceptedTranslation(related.at, related.ft_array, related.tr_array, step);
			if (at) atUpserts.push(at);
		}

		console.log('atUpserts', atUpserts);

		const { error: insertError } = await supabase
			.from('accepted_translations')
			.upsert(atUpserts, { onConflict: 'id' });
		if (insertError) return insertError;
	}

	await buildAcceptedTranslations(relatedMap);

	// == end! == You have updated the relavent translation progresses and accepted translations for these values == //
	return;

	/*
		Section 2: map/organize relavent data by original segment's id
	

	// group rows them by value in an Object
	// original segment ID -> translation text-> forward translations rows with above text
	const currentTranslations: RelatedTranslations = {};
	// Map translations
	for (const translation of related_ft) {
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
	const currentProgress: Record<number, TranslationProgressRow> = Object.fromEntries(
		related_tp.map((row) => [row.original_id, row])
	);

	/*
		Section 3: Set Translation Progress to Review if it is in Forward
	

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

	/*
		Section 4: Identify accepted translation, if we can
	*/
}

function getAcceptedTranslation(
	at: AcceptedTranslationRow | null,
	ft_array: ForwardTranslationRow[],
	tr_array: TranslationReviewRow[],
	step: Database['public']['Enums']['TranslationStep']
) {
	// Group translations by their text (normalized)
	const translationGroups: Record<
		string,
		{ translations: ForwardTranslationRow[]; reviews: TranslationReviewRow[] }
	> = {};
	for (const ft of ft_array) {
		const text = ft.translation?.trim() ?? '';
		if (!translationGroups[text]) translationGroups[text] = { translations: [], reviews: [] };
		translationGroups[text].translations.push(ft);
	}
	for (const r of tr_array) {
		// get review's translation row
		const ft = ft_array.find((t) => t.id == r.translation_id);
		if (!ft) continue;
		// get translation row text
		const text = ft.translation?.trim() ?? '';
		if (!translationGroups[text]) translationGroups[text] = { translations: [], reviews: [] };
		translationGroups[text].reviews.push(r);
	}

	const userVotes: Record<string, { users: Set<string>; machineVote: boolean }> = {};

	// i- init winning translation metrics
	let winningText: string | null = null;
	let winningVotes = 0;
	let winningHasMachineVote = false;

	// % for each text option
	for (const text of Object.keys(translationGroups)) {
		if (!winningText) winningText = text;
		userVotes[text] = { users: new Set(), machineVote: false };
		// + add ft users, get if a machine votes
		for (const ft of translationGroups[text].translations) {
			if (!ft.user_id) userVotes[text].machineVote = true;
			else userVotes[text].users.add(ft.user_id);
		}
		// + add review users
		for (const r of translationGroups[text].reviews) {
			userVotes[text].users.add(r.reviewer_id);
		}

		// + score is number of user
		console.log('score: ' + userVotes[text].users.size, ' for ' + text);
		const votes = userVotes[text].users.size;
		if (votes > winningVotes) {
			winningText = text;
			winningVotes = votes;
			winningHasMachineVote = userVotes[text].machineVote;
		} else if (votes == winningVotes) {
			// if same votes, but this one had the machine, make it the winning translation
			if (userVotes[text].machineVote && !winningHasMachineVote) {
				winningText = text;
				winningVotes = votes;
				winningHasMachineVote = userVotes[text].machineVote;
			}
		}
		// if translation is the same,
	}

	// winning text is the accepted text, if so, return accepted translation row with a new score
	//if (at && translationGroups[winningText].translations.includes({})) console.log("existing winner");
	/* 
		@ aidan FOR MONDAY 3/23/26

		step 1: finish this insert acceptedT Insert
		step 2: finish above acceptedT Row (change score)
		step 3: if tie, give to review with machine vote (if possible)
		step 4: export answer options...
		step 5: breathe, take a walk, have a great day :)
		
		need for monday:
		original_id
		language
		score
		translation_id (earliest)
		translation_step (based on current progress)
		
		*/
	//const insert: AcceptedTranslationInsert = {translation_step}

	// ! if no winn
	if (!winningText) return at;

	// == return modified at if last AT is current AT winner.
	if (at) {
		const accepted_ft = ft_array.find((f) => f.id == at.translation_id);
		if (accepted_ft)
			if (accepted_ft.translation == winningText) {
				// modify at
				const modified_at: AcceptedTranslationRow = {
					...at,
					score: String(winningVotes),
					translation_step: step
				};
				return modified_at;
			}
	}

	const accepted_ft = translationGroups[winningText].translations[0];

	// == otherwise, create new AT row
	const new_at: AcceptedTranslationInsert = {
		translation_id: accepted_ft.id,
		language: accepted_ft.language,
		translation_step: step,
		original_id: accepted_ft.original_id,
		score: String(winningVotes)
	};

	return new_at;
}
