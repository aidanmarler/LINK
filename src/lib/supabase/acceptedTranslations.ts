import type { TranslationLanguage } from '$lib/types';
import { supabase } from '../../supabaseClient';
import type {
	AcceptedTranslationInsert,
	AcceptedTranslationRow,
	ForwardTranslationRow,
	TranslationProgressInsert,
	TranslationVerificationData,
	TranslationVerificationMap
} from './types';

// New helper function to pull forward translations once
export async function pullAcceptedTranslationsForAcceptedVerification(
	language: TranslationLanguage
) {
	const translations: Array<AcceptedTranslationRow> = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		const { data, error: fetchError } = await supabase
			.from('accepted_translations')
			.select('*')
			.eq('language', language)
			.eq('currently_accepted', true)
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

// Check accpeted Translations from TranslationVerificationMap
export async function CheckAcceptedTranslations(
	language: TranslationLanguage,
	verificationMap: TranslationVerificationMap
) {
	const toInsertAccepted: AcceptedTranslationInsert[] = []; // Accepted
	const toUpdateAccepted: { id: number }[] = []; // IDs to set currently_accepted = false
	const toInsertProgress: TranslationProgressInsert[] = []; // Original_Segment not yet tracked in progress

	for (const [originalIdStr, data] of Object.entries(verificationMap)) {
		const originalId = parseInt(originalIdStr);
		const { translationProgress, acceptedTranslation, forwardTranslations } = data;

		// Skip if no forward translations
		if (forwardTranslations.length === 0) continue;

		// Find best forward translation
		const bestForwardTranslationId = await determineBestTranslation(data);
		if (!bestForwardTranslationId) {
			console.warn('no best forward translation found');
			return;
		}

		// Case 1: No accepted translation yet, but we have forward translation(s)
		if (!acceptedTranslation && forwardTranslations.length > 0) {
			toInsertAccepted.push({
				language,
				original_id: originalId,
				translation_id: bestForwardTranslationId,
				translation_step: 'forward',
				currently_accepted: true
			});

			// Also create translation_progress if it doesn't exist
			if (!translationProgress) {
				toInsertProgress.push({
					language,
					original_id: originalId,
					translation_step: 'forward',
					automated_comments: null,
					admin_comments: null
				});
			}
		}
		// Case 2: 1 accepted, 1 forward, and they match -> skip
		else if (
			acceptedTranslation &&
			forwardTranslations.length === 1 &&
			acceptedTranslation.translation_id === forwardTranslations[0].id
		) {
			// All good, nothing to do
			continue;
		}
		// Case 3: 1 accepted, 1 forward, but they DON'T match -> update
		else if (
			acceptedTranslation &&
			forwardTranslations.length === 1 &&
			acceptedTranslation.translation_id !== forwardTranslations[0].id
		) {
			// Mark old one as no longer accepted
			toUpdateAccepted.push({ id: acceptedTranslation.id });

			// Add new accepted translation
			toInsertAccepted.push({
				language,
				original_id: originalId,
				translation_id: forwardTranslations[0].id,
				translation_step: 'forward',
				currently_accepted: true
			});
		}
		// Case 4: Accepted translation exists, multiple forward translations -> find best
		else if (acceptedTranslation && forwardTranslations.length > 1) {
			// If current accepted is still in the list, keep it
			const currentStillValid = forwardTranslations.some(
				(ft) => ft.id === acceptedTranslation.translation_id
			);

			if (!currentStillValid) {
				// Mark old one as no longer accepted
				toUpdateAccepted.push({ id: acceptedTranslation.id });

				// Add new accepted translation
				toInsertAccepted.push({
					language,
					original_id: originalId,
					translation_id: bestForwardTranslationId,
					translation_step: 'forward',
					currently_accepted: true
				});
			}
			// else: current accepted is still valid, keep it
		}
	}

	console.log(`${language} - Inserting ${toInsertAccepted.length} new accepted translations`);
	console.log(
		`${language} - Updating ${toUpdateAccepted.length} old accepted translations to false`
	);
	console.log(
		`${language} - Inserting ${toInsertProgress.length} new translation progress entries`
	);

	// Execute updates
	if (toUpdateAccepted.length > 0) {
		const updatePromises = toUpdateAccepted.map((update) =>
			supabase
				.from('accepted_translations')
				.update({ currently_accepted: false })
				.eq('id', update.id)
		);
		await Promise.all(updatePromises);
	}

	// Execute inserts
	if (toInsertAccepted.length > 0) {
		const { error: insertError } = await supabase
			.from('accepted_translations')
			.insert(toInsertAccepted);

		if (insertError) {
			console.error('Error inserting accepted translations:', insertError);
		}
	}

	// Insert TranslationProgress where needed
	if (toInsertProgress.length > 0) {
		const { error: insertError } = await supabase
			.from('translation_progress')
			.insert(toInsertProgress);

		if (insertError) {
			console.error('Error inserting translation progress:', insertError);
		}
	}

	return {
		acceptedInserted: toInsertAccepted.length,
		acceptedUpdated: toUpdateAccepted.length,
		progressInserted: toInsertProgress.length
	};
}

// Using contentual data, determin best translation.
async function determineBestTranslation(
	translationVerificationData: TranslationVerificationData
): Promise<number | null> {
	const { translationProgress, forwardTranslations } = translationVerificationData;
	if (forwardTranslations.length > 1) {
		console.log(
			'forwardTranslations.length',
			forwardTranslations.length,
			translationVerificationData
		);
	}
	if (forwardTranslations.length == 0) return null;
	if (forwardTranslations.length == 1) return forwardTranslations[0].id;
	let bestTranslation: number | null = null;
	// Start in step "forward"
	if (translationProgress?.translation_step == 'forward') {
		// Let's store each forwardTranslation to points like {forwardTranslation: points} so that at the end, we just choose the one with the most points.
		// for each ft, check for most repeating translation.
		// If tie, use the one with the most user_id (rather than user_id set to null)
		// Later, we can go on to check profiles for user_id's with qualifications.

		// Group translations by their text (normalized)
		const translationGroups: Record<string, ForwardTranslationRow[]> = {};
		for (const ft of forwardTranslations) {
			const text = ft.translation?.trim() ?? '';
			if (!translationGroups[text]) translationGroups[text] = [];
			translationGroups[text].push(ft);
		}

		// Calculate points for each unique translation text
		const translationScores: Record<
			string,
			{
				points: number;
				representativeId: number;
				count: number;
				userCount: number;
			}
		> = {};

		for (const [normalizedText, group] of Object.entries(translationGroups)) {
			let points = 0;
			let userCount = 0;

			// + 1 point per aligned review
			points += group.length * 1;

			// + 1 point for each written by a person
			for (const ft of group) {
				if (ft.user_id !== null) {
					points += 1;
					userCount++;
				}
				// Check profiles...
			}

			translationScores[normalizedText] = {
				points,
				representativeId: group[0].id,
				count: group.length,
				userCount
			};
		}

		// Find best translation (highest points)
		let mostPoints = -1;
		let bestScore = null;
		for (const [, score] of Object.entries(translationScores)) {
			if (score.points > mostPoints) {
				mostPoints = score.points;
				bestScore = score;
			} else if (score.points === mostPoints && bestScore) {
				if (score.userCount > bestScore.userCount) {
					bestScore = score;
				} else if (score.userCount === bestScore.userCount) {
					if (score.representativeId > bestScore.representativeId) {
						bestScore = score;
					}
				}
			}
		}

		bestTranslation = bestScore?.representativeId ?? null;
		/*
		bestTranslation = bestScore?.representativeId ?? null;

		if (bestScore && bestScore.count >= 3) {
			const totalTranslations = forwardTranslations.length;
			const agreementRate = bestScore.count / totalTranslations;

            
			if (agreementRate >= 0.9) {

				console.log(
					`Forward translation threshold met for original_id ${forwardTranslations[0].original_id} - ready for review`
				);
			}
		}
        */
	}
	/*
    
    case 'review':
        // COME BACK: Check for most voted review
        break;

    case 'backward':
        // COME BACK: Check based on forward rules
        break;

    case 'adjudication':
        // COME BACK: Nothing really
        break;

    case 'admin':
        // COME BACK: Use one pushed through by admin user.
        break;
    
        */
	if (bestTranslation == null) {
		bestTranslation = forwardTranslations[0].id;
	}
	return bestTranslation;
}
