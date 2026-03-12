import JSZip from 'jszip';
import { pullArcTranslations, type ArcStructure } from './pullArcTranslations';
import Papa from 'papaparse';
import type { ForwardTranslationRow, OriginalSegmentRow } from '$lib/supabase/types';
import { pullLink, type LinkTranslation, type LinkTranslationsRecord } from './pullLink';

//type CsvData = Record<string, unknown[]>;

// I am using arrow functions in this script just for practice.
// I think they make no difference to performance here, nor readability.
// But I don't use them much so I figured it would be a nice practice to use them here.

// == == Zip Tree Strucure, return blob == == //
const zipFolderTree = async (tree: ArcStructure): Promise<string> => {
	console.log('Zip Started');
	// + intialize zip folder
	const zip = new JSZip();
	// & zip object to const zip
	const zipObject = async (tree: Record<string, unknown>, path: string = '') => {
		for (const [name, item] of Object.entries(tree)) {
			if (name.endsWith('ARCH.csv')) {
				const zipPath = path + '/' + name;
				const _unparseConfig: Papa.UnparseConfig = {};
				const itemTyped = item as Record<string, unknown>;
				const unparsedItem = Papa.unparse(Object.values(itemTyped) as unknown[]);
				zip.file(zipPath, unparsedItem);
			} else if (name.endsWith('.csv')) {
				const zipPath = path + '/' + name;
				const _unparseConfig: Papa.UnparseConfig = {};
				const unparsedItem = Papa.unparse(item as unknown[]);
				zip.file(zipPath, unparsedItem);
			} else {
				let newpath = path + '/' + name;
				if (path == '') newpath = name;
				zipObject(item as Record<string, unknown>, newpath);
			}
		}
	};
	// * zip object
	zipObject(tree);
	// * zip to blob
	const zipBlob = await zip.generateAsync({ type: 'blob' });
	// * blob to url
	const zipUrl = URL.createObjectURL(zipBlob);

	console.log('Zip Complete!');

	// == Return blob url == //
	return zipUrl;
};

type ArcColumn =
	| 'Form'
	| 'Section'
	| 'Question'
	| 'Answer Options'
	| 'Definition'
	| 'Completion Guideline';

type ArcColumnReport =
	| 'Question Translation Reviewers'
	| 'Definition Translation Reviewers'
	| 'Completion Guideline Translation Reviewers'
	| 'Form Translation Reviewers'
	| 'Section Translation Reviewers'
	| 'Answer Options Translation Reviewers';

// + get label for this segment type
const arcColumns: Record<string, ArcColumn> = {
	question: 'Question',
	definition: 'Definition',
	completionGuide: 'Completion Guideline',
	answerOption: 'Question',
	formLabel: 'Question',
	sectionLabel: 'Question'
};

const arcColumnReports: Record<ArcColumn, ArcColumnReport> = {
	Question: 'Question Translation Reviewers',
	Definition: 'Definition Translation Reviewers',
	'Completion Guideline': 'Completion Guideline Translation Reviewers',
	Form: 'Form Translation Reviewers',
	Section: 'Section Translation Reviewers',
	'Answer Options': 'Answer Options Translation Reviewers'
};

//"listItem" | "question" | "answerOption" | "definition" | "completionGuide" | "formLabel" | "sectionLabel"

// == == Modify arc data using link segments to find item and translationData to change it == == //
const modifyArcFromLink = async (
	arc: ArcStructure,
	segments: Record<number, OriginalSegmentRow>,
	link: LinkTranslationsRecord
): Promise<ArcStructure> => {
	/*  
	( i ) arc is structured as follows: 
	 	version > language > ARCH.csv, Lists, paper_like_details.csv, supplemental_phrases.csv

	*/

	// & modify all form or section labels

	// & modify all answer options

	// & modify all form or section labels
	const processLinkTranslation = (
		lt: LinkTranslation
	): // return Text, Score, and Error Message
	[string, string, string?] => {
		console.log(processLinkTranslation);

		// ! catch missing required rows
		if (!lt.forwardTranslations) return ['', '', 'Missing forward translations'];
		if (!lt.acceptedTranslations) return ['', '', 'Missing accepted translations'];
		//if (!t.translationProgress) return ['', '', 'Missing translation progress'];

		//console.log(translationProgress, forwardTranslations, translationReviews, acceptedTranslations);
		// + get accepted translation row
		const at = lt.acceptedTranslations.sort((r1, r2) => {
			if (r1.created_at < r2.created_at) return -1;
			else return 1;
		})[0];

		// + get accepted forward translation row
		const ft = lt.forwardTranslations.find((r) => {
			if (r.id == at.translation_id) return r;
		});

		// ! catch missing forward translation
		if (!ft) return ['', '', 'Missing forward translation at accepted T id'];
		// ! catch missing forward translation
		if (!ft.translation) return ['', '', 'Forward translation is only a comment'];

		// == get score
		// @ aidan! Move this later to its own function to check score.
		// 		should this be actually in the accepted translation?
		// 		NO: if we calcualte again now we know the numbers are up to date.
		// 		YES: numbers will be up to date if it always updates accepted transaltion on submission

		// 		YES!: numbers HAVE to be checked on submit, so we may as well keep it updated with each submission.
		//			I would put it with accepted translation. If the accepted translation changes, push a new row. Otherwise update the current accepted translation with this score.

		/*
			What is the score?
			# of times the forward translation was reviewed or voted

			1) get the number of == forward translations {forwardScore}
				ai = number of ai's who made wrote this exact forward translation
				human = number of humans who wrote this exact forward translation
				1 ai -> +0
				1 human -> +1
				2+ ai -> +1
				1+ ai, 1 human -> +2
				2 human -> +4

			2) get (votes for that translation) / (times seen) {reviewScore}

		*/

		// * map forward translations by the number of == reviews
		const mappedFt: Record<string, ForwardTranslationRow[]> = {};
		for (const t of lt.forwardTranslations) {
			if (!t.translation) continue;
			const trans = t.translation;
			// = push the item to proper spot
			if (!mappedFt[trans]) mappedFt[trans] = [t];
			else mappedFt[trans].push(t);
		}

		console.log(lt.acceptedTranslations.length, lt.acceptedTranslations, at.currently_accepted);

		return [ft.translation, 'Score'];
	};

	// + get arc version and store
	const v = Object.keys(arc)[0];
	// + store english arc of this version
	const arcEnglish = arc[v]['English'];

	// %% for language translated in link
	for (const language in link) {
		// + get language with first letter uppercase
		const langArc = language.charAt(0).toUpperCase() + language.slice(1);

		// ! catch if section is missing
		if (
			!arc[v]['English'] ||
			!arc[v]['English']['ARCH.csv'] ||
			!arc[v]['English']['Lists'] ||
			!arc[v]['English']['paper_like_details.csv'] ||
			!arc[v][langArc] ||
			!arc[v][langArc]['ARCH.csv'] ||
			!arc[v][langArc]['Lists'] ||
			!arc[v][langArc]['paper_like_details.csv']
		) {
			console.error('missing section', arc[v], langArc);
			continue;
		}

		// %% for link segment in this language's data
		for (const oId in link[language]) {
			// + get info
			const segment = segments[oId];
			const linkTranslation = link[language][oId];

			// ! catch if no segment
			if (!segment) {
				console.error('missing original segment #' + oId, linkTranslation);
				continue;
			}

			console.log('ProcessTranslation');
			// * Get accepted translation Text and Score
			const [translationText, translationScore, errorMessage] =
				processLinkTranslation(linkTranslation);

			console.log('processed', [translationText, translationScore, errorMessage]);

			// ! catch if getting accepted translation or score failed
			if (errorMessage) {
				console.error(errorMessage);
				continue;
			}

			return arc;

			// == Questions, Definitions and Guides == //
			if (segment.type in ['question', 'completionGuide', 'definition']) {
				// ! catch if missing variable name
				if (!segment.location || segment.location.length < 1) {
					console.error('missing location', segment);
					continue;
				}

				if (!arc[v][langArc]['ARCH.csv']) continue;

				// + get type label
				const column = arcColumns[segment.type];
				const reportColumn = arcColumnReports[column];

				// + get arc current variable
				const variable = segment.location.at(-1) as string;

				// == Set New Translation! == //
				arc[v][langArc]['ARCH.csv'][variable][column] = translationText;

				// == Set Translation Rating == //
				arc[v][langArc]['ARCH.csv'][variable][reportColumn] = translationScore;
				continue;
			}

			// == List Items == //
			if (segment.type == 'listItem') {
				// ! catch if missing variable name
				if (!segment.location || segment.location.length < 1) {
					console.error('missing location', segment);
					continue;
				}

				if (!segment.location || segment.location.length < 3) continue;
				if (!arcEnglish['Lists']) continue;

				// + get csv in english and translated
				const csvEnglish: Record<string, string>[] =
					arcEnglish['Lists'][segment.location[1]][segment.location[2] + '.csv'];
				const csvTranslated: Record<string, string>[] =
					arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'];

				// + get item column name (contition, country, species, etc.)
				const listColumns: string[] = Object.keys(csvTranslated[0] as Record<string, string>);
				const itemType = listColumns[0];

				// * get row index of this entry from comparing original to english
				let index;
				for (const [i, row] of csvEnglish.entries()) {
					if (row[itemType] == segment.segment) {
						index = i;
					}
				}
				if (!index) continue;

				// ! if can't find this index, throw error
				if (!arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index]) {
					console.error(
						"Can't find index in list.csv array",
						arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'],
						index
					);
					continue;
				}

				// ! if can't find this column, throw error
				if (
					!arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
						itemType
					]
				) {
					console.error(
						"Can't find item column",
						arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index],
						itemType
					);
					continue;
				}

				// == Set New Translation! == //
				arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
					itemType
				] = translationText;

				// == Set Translation Rating == //
				arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
					'New Column' // 'Translation Reviewers'
				] = '999'; // translationScore;

				arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
					'Language Speaker Reviewed'
				] = '888'; // translationScore;

				console.log(
					arc[v][langArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index]
				);
				continue;
			}

			if (segment.type == 'answerOption') {
				continue;
			} else if (segment.type == 'formLabel') {
				continue;
			} else if (segment.type == 'sectionLabel') {
				continue;
			}

			continue;
		}
	}
	return arc;
};

// == == MAIN == ==
export async function exportMain(version: string) {
	// ( 1 ) pull arc
	const arc = await pullArcTranslations(version);

	// ( 2 ) pull link
	const [segments, translationData] = await pullLink(version);

	// ( 3 ) modify Arc-Translations
	const modifiedArc = await modifyArcFromLink(arc, segments, translationData);

	// ( 4 ) ZIP folder
	const zipUrl = await zipFolderTree(modifiedArc);

	return zipUrl;
}
