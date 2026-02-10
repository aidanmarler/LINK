import type { ARCHData, TranslationLanguage } from '$lib/types';
import { supabase } from '../../supabaseClient';
import type { ForwardTranslationInsert, ForwardTranslationRow, OriginalSegmentRow } from './types';

export async function MapArchToForwardTranslationInsert(
	language: TranslationLanguage,
	archEnglish: ARCHData,
	archTarget: ARCHData,
	originalIdMap: Record<string, { id: number; row: OriginalSegmentRow }>
): Promise<ForwardTranslationInsert[]> {
	const answersAdded = new Set<string>();
	const formsAdded = new Set<string>();
	const sectionsAdded = new Set<string>();

	console.log('Mapping ARCH forward translations for ', language);

	const inserts: ForwardTranslationInsert[] = Object.entries(archTarget).flatMap(
		([variable, targetDetails]) => {
			const englishDetails = archEnglish[variable];
			if (!englishDetails) {
				console.warn(`No English match found for entry: ${variable}`);
				return [];
			}
			variable = variable.trim();
			targetDetails.form = targetDetails.form.trim();
			targetDetails.section = targetDetails.section.trim();
			targetDetails.question = targetDetails.question.trim();
			targetDetails.definition = targetDetails.definition.trim();
			targetDetails.completionGuide = targetDetails.completionGuide.trim();
			englishDetails.form = englishDetails.form.trim();
			englishDetails.section = englishDetails.section.trim();
			englishDetails.question = englishDetails.question.trim();
			englishDetails.definition = englishDetails.definition.trim();
			englishDetails.completionGuide = englishDetails.completionGuide.trim();

			const segments: ForwardTranslationInsert[] = [];

			const baseLocation = ['ARC', englishDetails.form, englishDetails.section, variable].filter(
				Boolean
			);

			const createSegment = (
				englishText: string,
				targetText: string,
				type: string,
				location?: string[],
				answerOptions?: string[]
			): ForwardTranslationInsert | null => {
				englishText = englishText?.trim();
				targetText = targetText?.trim();
				const key = `${englishText}|${type}|${location ?? ''}|${answerOptions ?? ''}`;
				const original = originalIdMap[key];

				if (!original) {
					//console.warn(`No original segment found for key: ${key}`);
					return null;
				}

				//console.log('Mapping segment:', { original, targetText, key });

				if ((!targetText || targetText === '') && (!englishText || englishText === '')) {
					// No target text, no english text, skip
					return null;
				}

				if (!targetText || targetText === '' || !englishText || englishText === '') {
					// Either target text or english text is missing, log and skip
					//console.warn(`Failed! arch | english:${englishText} | ${language}:${targetText} |`, key);
					return null;
				}
				//console.log(`Success! arch | english:${englishText} | ${language}:${targetText} |`, key);

				return {
					translation: targetText,
					language: language,
					user_id: null,
					original_id: original.id,
					skipped: false,
					comment: 'machine translation'
				};
			};

			// Question
			const questionSegment = createSegment(
				englishDetails.question,
				targetDetails.question,
				'question',
				baseLocation
			);
			if (questionSegment) segments.push(questionSegment);

			// Definition
			const definitionSegment = createSegment(
				englishDetails.definition,
				targetDetails.definition,
				'definition',
				baseLocation
			);
			if (definitionSegment) segments.push(definitionSegment);

			// Completion Guide
			const guideSegment = createSegment(
				englishDetails.completionGuide,
				targetDetails.completionGuide,
				'completionGuide',
				baseLocation
			);
			if (guideSegment) segments.push(guideSegment);

			// Form Label
			if (!formsAdded.has(targetDetails.form)) {
				const formSegment = createSegment(englishDetails.form, targetDetails.form, 'formLabel', [
					'ARC',
					englishDetails.form
				]);
				if (formSegment) {
					segments.push(formSegment);
					formsAdded.add(targetDetails.form);
				}
			}

			// Section Label
			if (!sectionsAdded.has(targetDetails.section)) {
				const sectionSegment = createSegment(
					englishDetails.section,
					targetDetails.section,
					'sectionLabel',
					['ARC', englishDetails.form]
				);
				if (sectionSegment) {
					segments.push(sectionSegment);
					sectionsAdded.add(targetDetails.section);
				}
			}

			// Answer Options
			if (englishDetails.answerOptions && targetDetails.answerOptions) {
				const englishAnswers = Object.entries(englishDetails.answerOptions);
				const targetAnswers = Object.entries(targetDetails.answerOptions);

				for (let i = 0; i < englishAnswers.length; i++) {
					const [key, englishAnswer] = englishAnswers[i];
					const targetAnswer = targetAnswers.find(([k]) => k === key)?.[1];

					if (targetAnswer && !answersAdded.has(targetAnswer.trim())) {
						const answerSegment = createSegment(
							englishAnswer.trim(),
							targetAnswer.trim(),
							'answerOption'
						);
						if (answerSegment) {
							segments.push(answerSegment);
							answersAdded.add(targetAnswer.trim());
						}
					}
				}
			}
			return segments;
		}
	);

	return inserts;
}

// Function to map csvEnglish ARCHData to OriginalSegmentInsert Type
export async function MapListToForwardTranslationInsert(
	list: string,
	listTarget: { [sublist: string]: string[][] },
	listEnglish: { [sublist: string]: string[][] },
	originalIdMap: Record<string, { id: number; row: OriginalSegmentRow }>,
	language: TranslationLanguage
): Promise<ForwardTranslationInsert[]> {
	const inserts: ForwardTranslationInsert[] = [];
	// First, get the original_id for each segment
	for (const sublist in listEnglish) {
		for (const item in listEnglish[sublist]) {
			const segment = listEnglish[sublist][item][0].trim();
			const translation = listTarget[sublist]?.[item]?.[0].trim();
			const location = ['Lists', list, sublist, segment]; // list location
			const key = `${segment}|${location}`;

			if ((!translation || translation === '') && (!segment || segment === '')) {
				// No segment, no translation, skip
				continue;
			}
			if (!translation || translation === '' || !segment || segment === '') {
				// Either target text or english text is missing, log and skip
				//console.warn(`Failed! List: ${list}, ${sublist} | english: ${segment} | ${language}: ${translation} | `,key);
				continue;
			}
			//console.log(`Success! List: ${list}, ${sublist} | english: ${segment} | ${language}: ${translation} | `,key);
			inserts.push({
				translation: translation,
				language: language,
				user_id: null,
				original_id: originalIdMap[key].id,
				skipped: false,
				comment: 'machine translation'
			});
		}
	}
	return inserts;
}

// New helper function to pull forward translations once
export async function pullMachineForwardTranslations(language: TranslationLanguage) {
	const translations: Array<{ original_id: number; translation: string }> = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		const { data, error: fetchError } = await supabase
			.from('forward_translations')
			.select('original_id, translation')
			.eq('language', language)
			.is('user_id', null)
			.not('translation', 'is', null) // Add this line
			.range(page * pageSize, (page + 1) * pageSize - 1);

		if (fetchError) {
			console.error('Error fetching existing translations:', fetchError);
			return [];
		}

		if (data) {
			// filter to those without null translations
			translations.push(
				...(data as {
					original_id: number;
					translation: string;
				}[])
			);
			hasMore = data.length === pageSize;
			page++;
		} else {
			hasMore = false;
		}
	}

	return translations;
}

// New helper function to pull forward translations once
export async function pullForwardTranslationsForAcceptedVerification(
	language: TranslationLanguage
) {
	const translations: ForwardTranslationRow[] = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		const { data, error: fetchError } = await supabase
			.from('forward_translations')
			.select('*')
			.eq('language', language)
			.not('translation', 'is', null)
			.not('skipped', 'is', true)
			.range(page * pageSize, (page + 1) * pageSize - 1);

		if (fetchError) {
			console.error('Error fetching existing translations:', fetchError);
			return [];
		}

		if (data) {
			// filter to those without null translations
			translations.push(...data);
			hasMore = data.length === pageSize;
			page++;
		} else {
			hasMore = false;
		}
	}

	return translations;
}

export async function UpdateForwardTranslations(
	language: TranslationLanguage,
	newTranslations: ForwardTranslationInsert[],
	existingTranslations: Array<{ original_id: number; translation: string }>
	//listsOrArch: 'lists' | 'arch'
) {
	// Create lookup: "original_id|translation" -> exists
	const existingSet = new Set(
		existingTranslations?.map((t) => `${t.original_id}|${t.translation.trim()}`) || []
	);

	console.log(`New ${language} translations before filtering if they exist...`, newTranslations);

	// Filter to only new translations (also trim new translations for comparison)
	const toInsert = newTranslations.filter((t) => {
		const key = `${t.original_id}|${t.translation?.trim() ?? ''}`;
		const exists = existingSet.has(key);

		// Debug: log cases where original_id matches but translation doesn't
		if (!exists) {
			const matchingOriginalId = existingTranslations.find(
				(existing) => existing.original_id === t.original_id
			);
			if (matchingOriginalId) {
				console.log(`Mismatch for original_id ${t.original_id}:`);
				console.log(`  New: "${t.translation}"`);
				console.log(`  Existing: "${matchingOriginalId.translation}"`);
				//console.log(`  Length diff: ${t.translation?.length} vs ${matchingOriginalId.translation.length}`);
			}
		}

		return !exists;
	});

	console.log(`New ${language} translations after filtering if they exist...`, toInsert);

	if (toInsert.length > 0) {
		const { error: insertError } = await supabase.from('forward_translations').insert(toInsert);

		if (insertError) {
			console.error('Insert error:', insertError);
			return { error: insertError };
		}
	}

	console.log('Successfully inserted new translations', toInsert);

	return { success: true, inserted: toInsert.length };
}

// Get Forward Translations for given segments
export async function pullForwardTranslationsForSegments(
	language: TranslationLanguage,
	segmentIds: number[]
) {
	console.log('01 pullForwardTranslationsForSegments', segmentIds.length);
	const translations: Array<ForwardTranslationRow> = [];
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
				.from('forward_translations')
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

	console.log('02 pullForwardTranslationsForSegments', translations.length);
	return translations;
}
