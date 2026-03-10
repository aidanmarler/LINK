import JSZip from 'jszip';
import { pullArcTranslations, type ArcStructure } from './pullArcTranslations';
import Papa from 'papaparse';
import type { ForwardTranslationRow, OriginalSegmentRow } from '$lib/supabase/types';
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
				const unparsedItem = Papa.unparse(Object.values(item) as unknown[]);
				console.log('arch', Object.values(item), unparsedItem);

				zip.file(zipPath, unparsedItem);
			} else if (name.endsWith('.csv')) {
				console.log([item]);
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

	// == for language translated in link
	for (const language in link) {
		// + store data in language
		const langData = link[language];

		// + get language with first letter uppercase
		const arcLang = language.charAt(0).toUpperCase() + language.slice(1);

		// + store arc translation of this version
		const arcSection = arc[v][arcLang];

		// ! catch if section is missing
		if (!arcSection['ARCH.csv'] || !arcSection['Lists'] || !arcSection['paper_like_details.csv']) {
			console.error('missing section', arcSection);
			continue;
		}

		//const arcCSV = arcSection['ARCH.csv'];

		// == for link segment in this language's data
		for (const oId in langData) {
			// + get info
			const segment = segments[oId];
			const translationData = langData[oId];

			// ! catch if no segment
			if (!segment) {
				console.error('missing original segment #' + oId, translationData);
				continue;
			}

			// ! catch if no accepted translation
			if (!translationData.acceptedTranslations) {
				console.error('missing accepted translation', segment);
				continue;
			}

			//console.log(segment, translationData);
			// * get segment location
			if (segment.type == 'question') {
				// ! catch if missing variable name
				if (!segment.location || segment.location.length < 1) {
					console.error('missing location', segment);
					continue;
				}

				// + get arc current variable
				const variable = segment.location.at(-1) as string;

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

				// * get translation review score

				//const row = arcCSV[variable];
				//const question = row['Question'];

				// == Set New Translation! == //

				//console.log(arc[v][arcLang]['ARCH.csv'][variable]['Question']);
				arc[v][arcLang]['ARCH.csv'][variable]['Question'] = 'test'; //acceptedTranslation.translation;

				// == Set Translation Rating == //
				arc[v][arcLang]['ARCH.csv'][variable]['Question Translation Reviewers'] = '1';
			} else if (segment.type == 'definition') {
				continue;
				//const arcId = segment.location?.at(-1);
				//console.log(arcSection['ARCH.csv'][arcId]["Definition"]);
			} else if (segment.type == 'completionGuide') {
				continue;
				//const arcId = segment.location?.at(-1);
				//console.log(arcSection['ARCH.csv'][arcId]["Completion Guideline"]);
			} else if (segment.type == 'answerOption') {
				continue;
			} else if (segment.type == 'formLabel') {
				continue;
			} else if (segment.type == 'sectionLabel') {
				continue;
			} else if (segment.type == 'listItem') {
				continue;
				if (!segment.location) continue;
				const loc0 = segment.location[0];
				if (!segment.location) continue;
				const csvEnglish = arcEnglish[loc0][segment.location[1]][segment.location[2] + '.csv'];
				const csvTranslated =
					arcSection[segment.location[0]][segment.location[1]][segment.location[2] + '.csv'];
				// + get item column name (contition, country, species, etc.)
				const itemType = Object.keys(csvTranslated[0])[0];

				for (const [i, row] of csvEnglish.entries()) {
					if (row[itemType] == segment.segment) {
						console.log(csvEnglish[i][itemType], csvTranslated[i][itemType]);
					}
				}
			} else continue;
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
