import JSZip from 'jszip';
import { pullArcTranslations, type ArcStructure } from './pullArcTranslations';
import Papa from 'papaparse';
import type { OriginalSegmentRow } from '$lib/supabase/types';
import { pullLink, type LinkTranslationData } from './pullLink';

//type CsvData = Record<string, unknown[]>;

// I am using arrow functions in this script just for practice.
// I think they make no difference to performance here, nor readability.
// But I don't use them much so I figured it would be a nice practice to use them here.

// == == Zip Tree Strucure, return blob == == //
const zipFolderTree = async (tree: ArcStructure): Promise<string> => {
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

	// == Return blob url == //
	return zipUrl;
};

// + get label for this segment type
const typeLabels = {
	question: 'Question',
	definition: 'Definition',
	completionGuide: 'Completion Guideline',
	listItem: '',
	answerOption: '',
	formLabel: '',
	sectionLabel: ''
};

//"listItem" | "question" | "answerOption" | "definition" | "completionGuide" | "formLabel" | "sectionLabel"

// == == Modify arc data using link segments to find item and translationData to change it == == //
const modifyArcFromLink = async (
	arc: ArcStructure,
	segments: Record<number, OriginalSegmentRow>,
	link: LinkTranslationData
): Promise<ArcStructure> => {
	/*  
	( i ) arc is structured as follows: 
	 	version > language > ARCH.csv, Lists, paper_like_details.csv, supplemental_phrases.csv

	*/

	// & modify all form or section labels

	// & modify all answer options

	// + get arc version and store
	const v = Object.keys(arc)[0];
	// + store english arc of this version
	const arcEnglish = arc[v]['English'];

	// %% for language translated in link
	for (const language in link) {
		// + store data in language
		const langData = link[language];
		// + get language with first letter uppercase
		const languageArc = language.charAt(0).toUpperCase() + language.slice(1);
		// + store arc translation of this version
		const arcTranslation = arc[v][languageArc];

		// ! catch if section is missing
		if (
			!arcTranslation['ARCH.csv'] ||
			!arcTranslation['Lists'] ||
			!arcTranslation['paper_like_details.csv']
		) {
			console.error('missing section', arcTranslation);
			continue;
		}

		//const arcCSV = arcSection['ARCH.csv'];

		// %% for link segment in this language's data
		for (const oId in langData) {
			// + get info
			const segment = segments[oId];
			const translationData = langData[oId];

			// ! catch if no segment
			if (!segment) {
				console.error('missing original segment #' + oId, translationData);
				continue;
			}

			// + get type label
			const typeLabel = typeLabels[segment.type];

			// ! catch if no accepted translation
			if (!translationData.acceptedTranslations) {
				console.error('missing accepted translation', segment);
				continue;
			}

			// + get accepted translation
			const acceptedId: number = translationData.acceptedTranslations[0].translation_id;
			const acceptedTranslation = translationData.forwardTranslations?.find(
				(t) => t.id == acceptedId
			);

			// ! catch if no accepted translation
			if (!acceptedTranslation) {
				console.error('cant find accepted translation in forward translations', translationData);
				continue;
			}

			// * calc review item review score

			// == Questions, Definitions and Guides == //
			if (segment.type in ['question', 'completionGuide', 'definition']) {
				// ! catch if missing variable name
				if (!segment.location || segment.location.length < 1) {
					console.error('missing location', segment);
					continue;
				}
				// + get arc current variable
				const variable = segment.location.at(-1) as string;

				// == Set New Translation! == //
				// @ts-expect-error location known in arc
				arc[v][languageArc]['ARCH.csv'][variable][typeLabel] = acceptedTranslation.translation;

				// == Set Translation Rating == //
				// @ts-expect-error location known in arc
				arc[v][languageArc]['ARCH.csv'][variable][typeLabel + ' Translation Reviewers'] = '1';
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

				// + get csv in english and translated
				// @ts-expect-error location known in arc
				const e = arcEnglish[segment.location[0]]; // only on this line to expect type errorss
				const csvEnglish = e[segment.location[1]][segment.location[2] + '.csv'];
				// @ts-expect-error location known in arc
				const t = arcTranslation[segment.location[0]]; // only on this line to expect type errors
				const csvTranslated = t[segment.location[1]][segment.location[2] + '.csv'];

				// + get item column name (contition, country, species, etc.)
				const itemType = Object.keys(csvTranslated[0])[0];

				let index;
				for (const [i, row] of csvEnglish.entries()) {
					if (row[itemType] == segment.segment) {
						index = i;
						//console.log(csvEnglish[i][itemType], csvTranslated[i][itemType]);
					}
				}
				if (!index) continue;

				/*
				console.log(
					arc[v][languageArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
						itemType
					],
					arc[v][languageArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index],
					arc[v][languageArc]['Lists'][segment.location[1]][segment.location[2] + '.csv']
				);*/

				// ! if can't find this index, throw error
				if (!arcTranslation['Lists'][segment.location[1]][segment.location[2] + '.csv'][index]) {
					console.error(
						"Can't find index in list.csv array",
						arcTranslation['Lists'][segment.location[1]][segment.location[2] + '.csv'],
						index
					);
					continue;
				}
				// ! if can't find this column, throw error
				if (
					!arcTranslation['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
						itemType
					]
				) {
					console.error(
						"Can't find item column",
						arcTranslation['Lists'][segment.location[1]][segment.location[2] + '.csv'][index],
						itemType
					);
					continue;
				}

				// == Set New Translation! == //
				arc[v][languageArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
					itemType
				] = 'test'; //acceptedTranslation.translation;

				// == Set Translation Rating == //
				arc[v][languageArc]['Lists'][segment.location[1]][segment.location[2] + '.csv'][index][
					'Translation Reviewers'
				] = '1';
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
