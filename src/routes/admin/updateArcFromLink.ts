import type { OriginalSegmentRow } from '$lib/supabase/types';
import type { ArcVersionStructure } from './pullArcTranslations';
import type { LinkTranslation, LinkTranslationsRecord } from './pullLink';

// == == Format arc to have needed new columns == == //
export const formatArc = async (arc: ArcVersionStructure) => {
	const v = Object.keys(arc)[0];
	const archLanguages = Object.keys(arc[v]);
	for (const l of archLanguages) {
		if (l == 'English') continue;

		// Initalize arch review score as 0
		if (arc[v][l]['ARCH.csv']) {
			for (const [k, r] of Object.entries(arc[v][l]['ARCH.csv'])) {
				if (arc[v][l]['ARCH.csv'][k]['Form Translation Reviewers'] == undefined)
					arc[v][l]['ARCH.csv'][k]['Form Translation Reviewers'] = r['Form'] == '' ? '' : '0';
				if (arc[v][l]['ARCH.csv'][k]['Section Translation Reviewers'] == undefined)
					arc[v][l]['ARCH.csv'][k]['Section Translation Reviewers'] = r['Section'] == '' ? '' : '0';
				if (arc[v][l]['ARCH.csv'][k]['Question Translation Reviewers'] == undefined)
					arc[v][l]['ARCH.csv'][k]['Question Translation Reviewers'] =
						r['Question'] == '' ? '' : '0';
				if (arc[v][l]['ARCH.csv'][k]['Definition Translation Reviewers'] == undefined)
					arc[v][l]['ARCH.csv'][k]['Definition Translation Reviewers'] =
						r['Definition'] == '' ? '' : '0';
				if (arc[v][l]['ARCH.csv'][k]['Completion Guideline Translation Reviewers'] == undefined)
					arc[v][l]['ARCH.csv'][k]['Completion Guideline Translation Reviewers'] =
						r['Completion Guideline'] == '' ? '' : '0';
				// @ fix answer options
				if (arc[v][l]['ARCH.csv'][k]['Answer Options Translation Reviewers'] == undefined)
					if (r['Answer Options'] !== '') {
						/*
						const ao_cleaned = arc[v][l]['ARCH.csv'][k]['Answer Options']
							.trim()
							.split('|')
							.map((optionString) => {
								const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
								return text;
							});

						
						let ao_formatted = '';

						for (let i = 0; i < ao_cleaned.length; i++) {
							ao_formatted += ao_cleaned[i] + ': 0';
							if (i < ao_cleaned.length - 1) ao_formatted += ' | ';
						}*/

						arc[v][l]['ARCH.csv'][k]['Answer Options Translation Reviewers'] = '0';
					}
			}
		}

		// Initalize lists review score as 0
		if (arc[v][l]['Lists']) {
			const lists = arc[v][l]['Lists'];
			for (const list of Object.keys(lists)) {
				for (const sublist of Object.keys(arc[v][l]['Lists'][list])) {
					for (const r of Object.keys(arc[v][l]['Lists'][list][sublist])) {
						if (arc[v][l]['Lists'][list][sublist][+r]['Translation Reviewers'] == undefined)
							arc[v][l]['Lists'][list][sublist][+r]['Translation Reviewers'] = '0';
					}
				}
			}
		}
	}

	return arc;
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

// == == Modify arc data using link segments to find item and translationData to change it == == //
export const modifyArcFromLink = async (
	arc: ArcVersionStructure,
	segments: Record<number, OriginalSegmentRow>,
	link: LinkTranslationsRecord
): Promise<ArcVersionStructure> => {
	/*  
	( i ) arc is structured as follows: 
	 	version > language > ARCH.csv, Lists, paper_like_details.csv, supplemental_phrases.csv

	*/

	// & modify all form or section labels

	// & modify all answer options

	// & modify all form or section labels // return Text, Score, and Error Message
	const processLinkTranslation = (lt: LinkTranslation): [string, string, string?] => {
		// ! catch missing required rows
		if (!lt.forwardTranslations) return ['', '0', 'Missing forward translations'];
		if (!lt.acceptedTranslations) return ['', '0', 'Missing accepted translations'];
		if (!lt.translationProgress) return ['', '0', 'Missing translation progress'];

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
		if (!ft) return ['', '0', 'Missing forward translation at accepted T id'];
		// ! catch missing forward translation
		if (!ft.translation) return ['', '0', 'Forward translation is only a comment' + String(ft)];

		return [ft.translation, at.score];
	};

	//

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

		// i+ init a map of answer options, storing english, translation, and score
		//    after going through each oId, map answers to score
		const answerMap: Record<string, { ft: string; score: string; oId: number }> = {};

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

			// * Get accepted translation Text and Score
			const [translationText, translationScore, errorMessage] =
				processLinkTranslation(linkTranslation);

			// ! catch if getting accepted translation or score failed
			if (errorMessage) {
				console.error(errorMessage);
				continue;
			}

			// == Questions, Definitions and Guides == //
			if (['question', 'completionGuide', 'definition'].includes(segment.type)) {
				// ! catch if missing variable name
				if (!segment.location || segment.location.length < 1) {
					console.error('missing location', segment);
					continue;
				}

				if (!arc[v][langArc]['ARCH.csv']) {
					console.error('cant find arch.csv', arc[v][langArc]);
					continue;
				}

				// + get type label
				const column = arcColumns[segment.type];
				const reportColumn = arcColumnReports[column];

				// + get arc current variable
				const variable = segment.location.at(-1) as string;

				if (!arc[v][langArc]['ARCH.csv'][variable]) {
					console.warn('missing variable', variable, column, arc[v][langArc]['ARCH.csv'][variable]);
					continue;
				}

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

				console.log('csvEnglish', segment.location, csvEnglish);
				console.log('csvTranslated', segment.location, csvTranslated);
				if (!csvEnglish || !csvTranslated) continue;

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
					'Translation Reviewers'
				] = translationScore;

				continue;
			}

			// == Form and Section Labels == //
			if (segment.type == 'formLabel') {
				if (!arc[v][langArc]['ARCH.csv']) {
					console.error('cant find arch.csv', arc[v][langArc]);
					continue;
				}
				const archE = arcEnglish['ARCH.csv'];
				if (!archE) continue;

				// get all rows of arc english that have this as form label
				const keys: string[] = [];
				for (const [key, value] of Object.entries(archE))
					if (value.Form.trim() == segment.segment) keys.push(key);

				for (const key of keys) {
					//console.log(key, arc[v][langArc]['ARCH.csv'][key]);
					if (arc[v][langArc]['ARCH.csv'][key]) {
						if (arc[v][langArc]['ARCH.csv'][key].Form) {
							arc[v][langArc]['ARCH.csv'][key].Form = translationText;
							arc[v][langArc]['ARCH.csv'][key]['Form Translation Reviewers'] = translationScore;
						}
					}
				}
			} else if (segment.type == 'sectionLabel') {
				if (!arc[v][langArc]['ARCH.csv']) {
					console.error('cant find arch.csv', arc[v][langArc]);
					continue;
				}
				const archE = arcEnglish['ARCH.csv'];
				if (!archE) continue;

				// get all rows of arc english that have this as section label
				const keys: string[] = [];
				for (const [key, value] of Object.entries(archE))
					if (value.Section.trim() == segment.segment) keys.push(key);

				for (const key of keys) {
					//console.log(key, arc[v][langArc]['ARCH.csv'][key]);
					if (arc[v][langArc]['ARCH.csv'][key]) {
						if (arc[v][langArc]['ARCH.csv'][key].Section) {
							arc[v][langArc]['ARCH.csv'][key].Section = translationText;
							arc[v][langArc]['ARCH.csv'][key]['Section Translation Reviewers'] = translationScore;
						}
					} else {
						console.log('missing key:', key, arc[v][langArc]['ARCH.csv']);
					}
				}
			}

			// == Answer Options == //
			if (segment.type == 'answerOption')
				answerMap[segment.segment] = { ft: translationText, score: translationScore, oId: +oId };

			continue;
		}

		const eCsv = Object.entries(arc[v]['English']['ARCH.csv']);
		for (const [k, r] of eCsv) {
			if (!arc[v][langArc]['ARCH.csv'][k]) continue;

			if (r['Answer Options'] == '') continue;
			const ao_array = r['Answer Options']
				.trim()
				.split('|')
				.map((optionString) => {
					const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
					return text;
				});

			let ao_formatted = '';

			for (let i = 0; i < ao_array.length; i++) {
				console.log(ao_array);
				if (!ao_array[i]) continue;
				if (!answerMap[ao_array[i].trim()]) {
					console.warn('Answer Map missing |' + ao_array[i].trim() + '|');
					continue;
				}

				const ft = answerMap[ao_array[i].trim()].ft;
				const score = answerMap[ao_array[i].trim()].score;
				ao_formatted += ft + ': ' + score;
				if (i < ao_array.length - 1) ao_formatted += ' | ';
			}

			arc[v][langArc]['ARCH.csv'][k]['Answer Options Translation Reviewers'] = ao_formatted;
		}
	}
	return arc;
};
