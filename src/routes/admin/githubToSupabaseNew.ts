import type { GithubLanguage, TranslationLanguage } from '$lib/types';

import type {
	AcceptedTranslationInsert,
	ForwardTranslationInsert,
	ForwardTranslationRow,
	OriginalSegmentInsert,
	OriginalSegmentRow,
	TranslationProgressInsert
} from '$lib/supabase/types';
import {
	pullArcTranslations,
	type ArcLanguageStructure,
	type ArcStructure
} from './pullArcTranslations';
import { pullLink, type LinkSegments, type LinkTranslationsRecord } from './pullLink';
import { supabase } from '../../supabaseClient';
import _ from 'lodash';
import type { Database } from '$lib/supabase/database.types';
import { ArcEnglishToInsert, ListsEnglishToInsert, PLDEnglishToInsert } from './arcSegmentInsert';
import { HandleDocumentInsert } from './arcDocumentInsert';

// Handle
async function HandleArcOriginalSegments(
	arc: ArcStructure,
	segments: LinkSegments
): Promise<[LinkSegments, OriginalSegmentRow[] | null]> {
	const segmentsInLink: LinkSegments = {};
	const segmentsToInsert: OriginalSegmentInsert[] = [];
	const segmentsMaybeInsert: OriginalSegmentInsert[] = [];

	// * Get arc-english to insert
	const englishArc = arc['ARCH.csv'];
	if (englishArc) {
		const arcEnglishSegments = ArcEnglishToInsert(Object.values(englishArc));
		segmentsMaybeInsert.push(...arcEnglishSegments);
	}

	// * Get lists to insert
	const englishLists = arc['Lists'];
	if (englishLists) {
		const listsEnglishSegments = ListsEnglishToInsert(englishLists);
		segmentsMaybeInsert.push(...listsEnglishSegments);
	}

	// * Get paper like details to inserts
	const englishPaperLikeDetails = arc['paper_like_details.csv'];
	if (englishPaperLikeDetails) {
		// @ skip for now
		const _PLDEnglishSegments = PLDEnglishToInsert(englishPaperLikeDetails);
		//segmentsMaybeInsert.push(...PLDEnglishSegments);
	}

	// = (2) = get if segments are already in LINK
	console.log(" .. link's segments:", segments);
	const segmentsArray = Object.values(segments);

	// * add insert if it is not already in arc
	for (const insert of segmentsMaybeInsert) {
		const matchingSegment = segmentsArray.find((s) => {
			if (s.segment == insert.segment) {
				if (s.type == insert.type) {
					if (s.location || insert.location) {
						if (_.isEqual(s.location, insert.location)) return s;
					} else return s;
				}
			}
			return undefined;
		});
		// store if item is already in Link
		if (matchingSegment) segmentsInLink[matchingSegment.id] = matchingSegment;
		// otherwise, store it in list of items to add
		else segmentsToInsert.push(insert);
	}

	console.log(' .. segmentsInLink', segmentsInLink);
	/*
	// @ For testing
	const practiceSegmentsToInsert = segmentsToInsert.slice(0, 100);
	console.log(' .. practiceSegmentsToInsert', practiceSegmentsToInsert);
	if (practiceSegmentsToInsert.length < 1) return [segmentsInLink, null];
	const insert = await supabase
		.from('original_segments')
		.insert(practiceSegmentsToInsert)
		.select('*');
	if (insert.error) console.error('Insert error:', insert.error);
	*/

	console.log(' .. segmentsToInsert', segmentsToInsert);
	if (segmentsToInsert.length < 1) return [segmentsInLink, null];
	const insert = await supabase.from('original_segments').insert(segmentsToInsert).select('*');
	if (insert.error) console.error('Insert error:', insert.error);

	return [segmentsInLink, insert.data];
}

// & get forward translations for each inserted original item and push them to link
async function HandleNewForwardTranslations(
	arc: ArcLanguageStructure,
	newSegments: OriginalSegmentRow[] | null,
	_translations: LinkTranslationsRecord
) {
	if (!newSegments) return null;

	// store arch english
	const archEnglish = arc['English']['ARCH.csv'];
	const listsEnglish = arc['English']['Lists'];

	if (!archEnglish || !listsEnglish) return null;

	// create object to return
	const translationsToInsert: ForwardTranslationInsert[] = [];

	const failedSegments = [];

	console.log('newSegments', newSegments);

	for (const ns of newSegments) {
		// == Handle List Items == //
		if (ns.type == 'listItem') {
			if (!ns.location) {
				failedSegments.push([ns, 'no location']);
				continue;
			}

			const csvE = listsEnglish[ns.location[1]][ns.location[2] + '.csv'];
			if (!csvE) {
				failedSegments.push([
					ns,
					'no english form of csv found found',
					ns.location[1],
					ns.location[2] + '.csv',
					listsEnglish
				]);
				continue;
			}

			const column = Object.keys(csvE[0])[0];
			if (!column) {
				failedSegments.push([ns, 'no column found', column, csvE]);
				continue;
			}

			const index = Object.values(csvE).findIndex((r) => {
				return r[column].trim() == ns.segment;
			});
			if (index == -1) {
				failedSegments.push([ns, 'no index found', column, csvE]);
				continue;
			}

			for (const language in arc) {
				if (language == 'English') continue;
				const l = language.toLowerCase() as TranslationLanguage;

				const lists = arc[language]['Lists'];
				if (!lists) {
					failedSegments.push([ns, language, 'lists missing', arc[language]]);
					continue;
				}

				const csvT = lists[ns.location[1]][ns.location[2] + '.csv'];
				if (!csvT) {
					failedSegments.push([
						ns,
						language,
						'csv missing',
						lists,
						ns.location[1],
						ns.location[2] + '.csv'
					]);
					continue;
				}

				const tRow = Object.values(csvT)[index];
				if (!tRow) {
					failedSegments.push([
						{ ns: ns },
						language,
						'row missing in translated csv: ',
						index,
						{ csvE: csvE },
						{ csvT: csvT }
					]);
					continue;
				}

				const translation = tRow[column].trim();
				if (!translation) {
					failedSegments.push([
						ns,
						language,
						'column missing in translated row',
						csvT,
						index,
						tRow,
						column
					]);
					continue;
				}

				const t: ForwardTranslationInsert = {
					language: l,
					original_id: ns.id,
					skipped: false,
					translation: translation,
					comment: 'Machine Translation'
				};

				translationsToInsert.push(t);
			}
		}

		// == Handle standard Arc Columns == //
		type ArcColumn =
			| 'Form'
			| 'Section'
			| 'Question'
			| 'Answer Options'
			| 'Definition'
			| 'Completion Guideline';

		const archTypes: Database['public']['Enums']['SegmentType'][] = [
			'formLabel',
			'sectionLabel',
			'question',
			'definition',
			'completionGuide'
		];

		// == Handle Arch Items == //
		if (archTypes.includes(ns.type)) {
			// * get arch column
			const columns: Record<string, ArcColumn> = {
				formLabel: 'Form',
				sectionLabel: 'Section',
				question: 'Question',
				definition: 'Definition',
				completionGuide: 'Completion Guideline'
			};
			const col = columns[ns.type];

			// * get index of value in arch
			const index = Object.values(archEnglish).findIndex((r) => {
				return r[col].trim() == ns.segment;
			});

			if (index == -1) continue;

			// * get row and column at index for each language
			for (const language in arc) {
				if (language == 'English') continue;
				const l = language.toLowerCase() as TranslationLanguage;
				const archcsv = arc[language]['ARCH.csv'];
				if (!archcsv) continue;
				const tRow = Object.values(archcsv)[index];

				const t: ForwardTranslationInsert = {
					language: l,
					original_id: ns.id,
					skipped: false,
					translation: tRow[col],
					comment: 'Machine Translation'
				};

				translationsToInsert.push(t);
			}
		}

		if (ns.type == 'answerOption') {
			let subindex = -1;

			// Get index of answer option
			const index = Object.values(archEnglish).findIndex((r) => {
				const ao = r['Answer Options'].trim();
				if (!ao || ao == '') return false;

				const ao_cleaned = ao.split('|').map((optionString) => {
					const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
					return text;
				});
				const subI = ao_cleaned.findIndex((ao_c) => {
					return ao_c == ns.segment;
				});

				if (subI == -1) return false;
				subindex = subI;
				return true;
			});

			if (index == -1) continue;

			//console.log('ns.segment', ns.segment);
			//console.log('indexes:', index, subindex);

			/*
			const temp_ao_cleaned = Object.values(archEnglish)
				[index]['Answer Options'].trim()
				.split('|')
				.map((optionString) => {
					const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
					return text;
				});

				*/
			//console.log('values:', archEnglish[index], temp_ao_cleaned[subindex]);

			// * get row and column at index for each language
			for (const language in arc) {
				if (language == 'English') continue;
				const l = language.toLowerCase() as TranslationLanguage;
				const archcsv = arc[language]['ARCH.csv'];
				if (!archcsv) continue;
				const tRow = Object.values(archcsv)[index];

				const ao_cleaned = tRow['Answer Options']
					.trim()
					.split('|')
					.map((optionString) => {
						const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
						return text;
					});

				const ao = ao_cleaned[subindex];

				//console.log('ao translation', ao, ao_cleaned, subindex);

				if (!ao) continue;

				const t: ForwardTranslationInsert = {
					language: l,
					original_id: ns.id,
					skipped: false,
					translation: ao,
					comment: 'Machine Translation'
				};

				translationsToInsert.push(t);
			}

			// Get subindex of answer option

			// Answers
			/*
			if (ao != null && ao != '') {
				const ao_cleaned = ao.split('|').map((optionString) => {
					const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
					return text;
				});
				for (const ao_c of ao_cleaned)
					if (ao_c.trim() != '') {
						const answerOption: OriginalSegmentInsert = {
							segment: ao_c.trim(),
							type: 'answerOption'
						};
						if (!segmentsToAdd.some((seg) => _.isEqual(seg, answerOption)))
							segmentsToAdd.push(answerOption);
					}
			}
			
			// * get index of value in arch
			const index = Object.values(archEnglish).findIndex((r) => {
				
				return r[col].trim() == ns.segment;
			});

			ns.segment;
			// Answers
			if (ao != null && ao != '') {
				const ao_cleaned = ao.split('|').map((optionString) => {
					const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
					return text; // returns a tuple [key, value]
				});
				for (const ao_c in ao_cleaned)
					if (ao_c.trim() != '') {
						const answerOption: OriginalSegmentInsert = {
							segment: ao_c,
							type: 'answerOption'
						};
						if (!segmentsToAdd.includes(answerOption)) segmentsToAdd.push(answerOption);
					}
			}*/
		}
	}

	console.log('segments failed to find a translation for', failedSegments);

	const insert = await supabase
		.from('forward_translations')
		.insert(translationsToInsert)
		.select('*');

	if (insert.error) console.error('Insert error:', insert.error);

	return insert.data;
}

// & push new translation progress for each original item
async function HandleNewProgresses(translations: ForwardTranslationRow[] | null) {
	if (!translations) return;

	const progressesToInsert: TranslationProgressInsert[] = [];
	for (const t of translations) {
		progressesToInsert.push({
			language: t.language,
			original_id: t.original_id,
			translation_step: 'forward'
		});
	}

	const insert = await supabase.from('translation_progress').insert(progressesToInsert).select('*');

	if (insert.error) console.error('Insert error:', insert.error);

	return insert.data;
}

// & push new accepted translation for each translation pair
async function HandleNewAcceptedTranslations(translations: ForwardTranslationRow[] | null) {
	if (!translations) return;

	const acceptedToInsert: AcceptedTranslationInsert[] = [];
	for (const t of translations) {
		acceptedToInsert.push({
			language: t.language,
			original_id: t.original_id,
			translation_id: t.id,
			translation_step: 'forward',
			score: '0' // @ initial score
		});
	}

	const insert = await supabase.from('accepted_translations').insert(acceptedToInsert).select('*');

	if (insert.error) console.error('Insert error:', insert.error);

	return insert.data;
}

export async function AddArcVersionToLink(version: string, _languages: GithubLanguage[]) {
	// = (1) = get all of Arc Translations for this version
	const arcTranslations = await pullArcTranslations(version);
	const arcT = arcTranslations['ARCH' + version];

	// = (2) = get all of link data
	const [segments, translationData] = await pullLink(version);

	// = (3) = Get which segments already existed and new ones pushed
	const [existingSegments, newSegments] = await HandleArcOriginalSegments(
		arcT['English'],
		segments
	);

	// = (4) = find Arc-Translations for new segments and push them
	const newTranslations = await HandleNewForwardTranslations(arcT, newSegments, translationData);
	console.log('translationsToInsert', newTranslations);

	// = (5) = for translations, create translation progress row
	const newProgresses = await HandleNewProgresses(newTranslations);
	console.log('newProgresses', newProgresses);

	// = (6) = for translations, create first "Accepted Translation" row
	const newAccepted = await HandleNewAcceptedTranslations(newTranslations);
	console.log('newAccepted', newAccepted);

	// = (7) = Create documents!
	const allSegments: OriginalSegmentRow[] = [];
	if (Object.values(existingSegments)) allSegments.push(...Object.values(existingSegments));
	if (newSegments) allSegments.push(...newSegments);

	await HandleDocumentInsert(version, allSegments);
}
