import type { OriginalSegmentInsert } from '$lib/supabase/types';
import _ from 'lodash';

// & From arc english csv, get all possible LINK segment inserts
export function ArcEnglishToInsert(
	englishArc: {
		Variable: string;
		Form: string;
		Section: string;
		Question: string;
		'Answer Options': string;
		Definition: string;
		'Completion Guideline': string;
	}[]
) {
	const segmentsToAdd: OriginalSegmentInsert[] = [];
	for (const row of englishArc) {
		const f = row.Form.trim();
		const s = row.Section.trim();
		const q = row.Question.trim();
		const d = row.Definition.trim();
		const g = row['Completion Guideline'].trim();
		//const ao = row['Answer Options'].trim();
		const ao_array = !row['Answer Options'].trim()
			? []
			: row['Answer Options']
					.trim()
					.split('|')
					.map((optionString) => {
						const [_codeStr, text] = optionString.split(',').map((s) => s.trim());
						return text;
					});

		const ao_cleaned =
			!ao_array || ao_array.length == 0 ? [] : ao_array.filter((ao) => ao.trim() !== '');

		//['ARC', f, s, row.Variable];
		const baseLocation = ['ARC'];
		if (f != '') baseLocation.push(f);
		if (s != '') baseLocation.push(s);
		const variableLoc = [...baseLocation, row.Variable];

		// Form
		if (f != '') {
			const form: OriginalSegmentInsert = {
				segment: f,
				type: 'formLabel',
				location: ['ARC', f, 'Form Label']
			};
			if (!segmentsToAdd.some((seg) => _.isEqual(seg, form))) segmentsToAdd.push(form);
		}

		// Section
		if (s != '') {
			const section: OriginalSegmentInsert = {
				segment: s,
				type: 'sectionLabel',
				location: [...baseLocation, 'Section Label']
			};
			if (!segmentsToAdd.some((seg) => _.isEqual(seg, section))) segmentsToAdd.push(section);
		}

		// Question
		if (q != '') {
			const question: OriginalSegmentInsert = {
				segment: q,
				type: 'question',
				location: variableLoc,
				answer_options: ao_cleaned.length > 0 ? ao_cleaned : null
			};
			if (!segmentsToAdd.some((seg) => _.isEqual(seg, question))) segmentsToAdd.push(question);
		}

		// Defintion
		if (d != '') {
			const definition: OriginalSegmentInsert = {
				segment: row.Definition,
				type: 'definition',
				location: variableLoc
			};
			if (!segmentsToAdd.some((seg) => _.isEqual(seg, definition))) segmentsToAdd.push(definition);
		}

		// Compeltion Guide
		if (g != '') {
			const completionGuide: OriginalSegmentInsert = {
				segment: row['Completion Guideline'],
				type: 'completionGuide',
				location: variableLoc
			};
			if (!segmentsToAdd.some((seg) => _.isEqual(seg, completionGuide)))
				segmentsToAdd.push(completionGuide);
		}

		// Answers
		if (ao_cleaned.length > 0) {
			for (const ao of ao_cleaned) {
				const answerOption: OriginalSegmentInsert = {
					segment: ao,
					type: 'answerOption'
				};
				if (!segmentsToAdd.some((seg) => _.isEqual(seg, answerOption)))
					segmentsToAdd.push(answerOption);
			}
		}
	}
	return segmentsToAdd;
}

// & From arc english csv, get all possible LINK segment inserts
export function ListsEnglishToInsert(
	lists: Record<string, Record<string, Record<string, string>[]>>
) {
	const segmentsToAdd: OriginalSegmentInsert[] = [];
	// iterate through each list and sublist
	for (const listCSV of Object.keys(lists)) {
		const listLabel = listCSV.trim();
		for (const sublistCSV of Object.keys(lists[listCSV])) {
			const sublistLabel = sublistCSV.replace('.csv', '').trim();
			for (const row of lists[listCSV][sublistCSV]) {
				const column = Object.keys(row)[0];
				const segment = row[column].trim();
				// @ replace type with column label, allowing anything to be a type, not just specified things.
				const listItem: OriginalSegmentInsert = {
					segment: segment,
					type: 'listItem',
					location: ['Lists', listLabel, sublistLabel, segment]
				};
				if (!segmentsToAdd.some((seg) => _.isEqual(seg, listItem))) segmentsToAdd.push(listItem);
			}
		}
	}
	return segmentsToAdd;
}

// & From arc english csv, get all possible LINK segment inserts
export function PLDEnglishToInsert(pld: Record<string, string>[]) {
	const segmentsToAdd: OriginalSegmentInsert[] = [];
	for (const row of pld) {
		const section = row['Paper-like section'].trim();
		const text = row['Text'].trim();
		const item: OriginalSegmentInsert = {
			segment: text,
			// @ need new type!
			type: 'formLabel',
			location: ['Paper-like Details', section]
		};
		if (!segmentsToAdd.some((seg) => _.isEqual(seg, item))) segmentsToAdd.push(item);
	}

	return segmentsToAdd;
}
