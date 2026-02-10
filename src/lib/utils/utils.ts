import type { Database } from '$lib/database.types';
import type { SegmentData, SegmentMap } from '$lib/supabase/types';

// Function to capicapitalize first character of a string
export function capitalizeFirstLetter(string: string) {
	return String(string).charAt(0).toUpperCase() + String(string).slice(1);
}

function capitalizeWords(string: string) {
	return string.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function makeFolderLabel(string: string) {
	if (string == '') return 'null';
	return capitalizeWords(string.toLowerCase()).split(':')[0].replaceAll('_', ' ');
}

export function makeFolderNav(string: string) {
	if (string == '') return 'null';
	return string.split(':')[0].toLowerCase().replaceAll(' ', '_');
}

export function generateKey(strings: string[]): string {
	return strings.join('||||');
}

export function sortSegmentMap(original: SegmentMap): [number, SegmentData][] {
	const sortOrder: Database['public']['Enums']['SegmentType'][] = [
		'formLabel',
		'sectionLabel',
		'question',
		'definition',
		'completionGuide',
		'answerOption',
		'listItem'
	];
	const typeOrder = Object.fromEntries(sortOrder.map((type, index) => [type, index]));

	const sorted = Object.entries(original)
		.sort(([_ia, a], [_ib, b]) => {
			return typeOrder[a.originalSegment.type] - typeOrder[b.originalSegment.type];
		})
		.map(([key, value]) => [Number(key), value] as [number, SegmentData]);

	return sorted;
}
