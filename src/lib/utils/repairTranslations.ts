/*
Done with get link

== check progess exists for each language and og_segment ==
== check existing progress is correct for each language and og_segment == (If they are in review, do they have at least 1 human reviewer in forward translations)
--> modify progress with what you find.

== check accepted_translation exists for each language and og_segment ==
== check existing accepted_t reffered to f_translation exists, 
    and then that it really is the best one, 
    and that the review count matches. ==
--> modify a_translations with what you find.

*/

import type { Database } from '$lib/supabase/database.types';
import { getBestTranslation } from '$lib/supabase/translationProgress';
import type {
	AcceptedTranslationInsert,
	AcceptedTranslationRow,
	TranslationProgressInsert,
	TranslationProgressRow
} from '$lib/supabase/types';
import { getLatestEvent } from '$lib/supabase/utils';
import type { TranslationLanguage } from '$lib/types';
import { supabase } from '../../supabaseClient';
import { pullLink, pullPartialLink, type LinkStructure } from './pullLink';

type UpsertPAT = {
	progress: (TranslationProgressInsert | TranslationProgressRow)[];
	accepted: (AcceptedTranslationInsert | AcceptedTranslationRow)[];
};

export const repairLink = async (version: string) => {
	//const startT = performance.now();
	console.time('repairLink');
	const link = await pullLink(version);
	const upsertPAT = constructUpsertPAT(link);
	pushUpsertPAT(upsertPAT);
	console.timeEnd('repairLink');
	return;
	//const endT = performance.now();
	//console.log('Done! in ' + String((endT - startT) / 1000) + 's');
};

export const updateProgressAcceptedForSegments = async (
	ids: number[],
	language: TranslationLanguage
) => {
	console.time('update PATs');
	const link = await pullPartialLink(ids, language);
	console.log('partial link', link);
	const upsertPAT = constructUpsertPAT(link);
	console.log('upsertPAT', upsertPAT);
	await pushUpsertPAT(upsertPAT);
	console.timeEnd('update PATs');
	return;
};

const constructUpsertPAT = (link: LinkStructure): UpsertPAT => {
	const linkTranslations = link[1];
	const progressUpsert: (TranslationProgressInsert | TranslationProgressRow)[] = [];
	const acceptedUpsert: (AcceptedTranslationInsert | AcceptedTranslationRow)[] = [];

	// i itterate throughout the translations
	for (const language of Object.keys(linkTranslations)) {
		const l = language as Database['public']['Enums']['Language'];
		for (const [id, obj] of Object.entries(linkTranslations[language])) {
			// = 1 => Get best translation and score
			const ft = obj.forwardTranslations ?? [];
			const tr = obj.translationReviews ?? [];
			const best_ft = getBestTranslation(ft, tr);
			console.log("best_ft", best_ft);

			// = 2 => Update translation progress

			// + get obj's translation_step
			const objStep = obj.translationProgress?.translation_step;
			if (objStep == 'admin') continue;
			// + calculate obj's translation_step from info provided
			let calculatedStep: Database['public']['Enums']['TranslationStep'] = 'forward';
			const shouldReview = obj.forwardTranslations?.find(
				(t) => t.user_id != null && t.skipped != true
			);
			if (shouldReview) calculatedStep = 'review';
			if (best_ft?.canAdjudicate) calculatedStep = 'adjudication';

			console.log("calculatedStep", calculatedStep);

			// * create a new progress if missing
			const noProgress = obj.translationProgress == undefined;
			if (noProgress)
				progressUpsert.push({
					language: l,
					original_id: +id,
					translation_step: calculatedStep
				});

			// * update progress if in wrong step
			if (obj.translationProgress) {
				const rightSteps: Database['public']['Enums']['TranslationStep'][] = [
					'admin',
					calculatedStep
				];
				const rightStep = rightSteps.includes(obj.translationProgress.translation_step);
				if (rightStep) {
					calculatedStep = obj.translationProgress.translation_step;
				} else {
					const row = obj.translationProgress;
					row.translation_step = calculatedStep;
					console.log('progressUpsert', row);
					progressUpsert.push(row);
				}
			}

			// = 3 => Update accepted translation
			if (!best_ft) continue;

			// * create a new acceptedInsert if missing
			// Re-calculate Accepted Translation
			const current_at = getLatestEvent(obj.acceptedTranslations ?? []);

			console.log('current_at', current_at);

			// == otherwise, create new AT row
			const new_at: AcceptedTranslationInsert = {
				translation_id: best_ft.ft.id,
				language: best_ft.ft.language,
				translation_step: calculatedStep,
				original_id: +id,
				score: String(best_ft.score)
			};

			console.log('new_at', new_at);

			if (!new_at.score) continue;
			// New AT
			if (!current_at) acceptedUpsert.push(new_at);
			else {
				const same_id = current_at.translation_id == new_at.translation_id;
				const same_step = current_at.translation_step == new_at.translation_step;
				const same_score = current_at.score == new_at.score;
				if (!same_id || !same_step) acceptedUpsert.push(new_at);
				if (same_id && same_step && !same_score)
					acceptedUpsert.push({ ...current_at, score: new_at.score });
			}
		}
	}

	return { progress: progressUpsert, accepted: acceptedUpsert };
};

const pushUpsertPAT = async (upserts: UpsertPAT) => {
	if (upserts.progress.length > 0) {
		console.log('progressUpsert', upserts.progress);
		const { error: progressError } = await supabase
			.from('translation_progress')
			.upsert(upserts.progress, { onConflict: 'id' });
		if (progressError) console.error('Error upserting translation progresses', progressError);
	}

	if (upserts.accepted.length > 0) {
		console.log('acceptedUpsert', upserts.accepted);
		const inserts = upserts.accepted.filter(
			(r): r is AcceptedTranslationInsert => r.id === undefined
		);
		const updates = upserts.accepted.filter((r): r is AcceptedTranslationRow => r.id !== undefined);

		if (inserts.length > 0) {
			const { error } = await supabase.from('accepted_translations').insert(inserts);
			if (error) return error;
		}

		if (updates.length > 0) {
			const { error } = await supabase
				.from('accepted_translations')
				.upsert(updates, { onConflict: 'id' });
			if (error) return error;
		}
	}

	return;
};
