/* Lists Initialize */
// retrieve entire table of lists with only needed columns

import type {
	ListTranslation,
	SimpleTranslation,
	SimpleTranslationTable,
	TranslationLanguage,
	VariableTranslation,
	VariableTranslationTable
} from '$lib/types';
import { generateKey } from '$lib/utils/utils';
import { supabase } from '../../supabaseClient';

// specifically for verifying what needs to be uploaded to SupaBase and what we can leave
export async function getCurrentEntries_lists(language: TranslationLanguage) {
	async function pullRange(page: number, pageSize: number) {
		const { data, error } = await supabase
			.from('lists')
			.select('language, list, sublist, original, translation')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			console.error('Error fetching table', error);
			return [];
		}

		return data.map((translation) => ({
			translationLanguage: translation.language,
			list: translation.list,
			sublist: translation.sublist,
			original: translation.original,
			translation: translation.translation
		})) as ListTranslation[];
	}

	let totalData: ListTranslation[] = [];
	let page = 1;
	const pageSize = 1000;

	while (true) {
		console.log(page);
		if (page > 20) break;
		const rangeData = await pullRange(page, pageSize);
		console.log(rangeData.length);
		if (!rangeData || rangeData.length === 0) break;
		totalData = totalData.concat(rangeData); // Combine results
		page++; // Go to next page
	}

	console.log('Got translations!', totalData);

	return totalData;
}

export async function getCurrentEntries_questions(language: TranslationLanguage) {
	async function pullRange(page: number, pageSize: number) {
		const { data, error } = await supabase
			.from('questions')
			.select('variable_id, original')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);
		if (error) {
			console.error('Error fetching table', error);
			return {};
		}
		const range_variables: Record<string, string> = Object.fromEntries(
			data.map((item) => [item.variable_id, item.original])
		);
		return range_variables;
	}

	let variables: Record<string, string> = {};
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 40) break;
		const rangeData: Record<string, string> = await pullRange(page, pageSize);
		if (!rangeData || Object.keys(rangeData).length == 0) break;
		variables = { ...variables, ...rangeData };
		if (Object.keys(rangeData).length < pageSize) break;
		page++; // Go to next page
	}

	return variables;
}

export async function getExistingSimpleTranslations(
	table: SimpleTranslationTable,
	language: TranslationLanguage
): Promise<Map<string, SimpleTranslation>> {
	async function pullRange(page: number, pageSize: number): Promise<SimpleTranslation[]> {
		const { data, error } = await supabase
			.from(table)
			.select('original, translation')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			console.error('Error fetching ' + table, error);
			return [];
		}

		const range_data: SimpleTranslation[] = data.map((item) => ({
			language: language,
			original: item.original,
			translation: item.translation
		}));

		return range_data;
	}

	const allData = new Map<string, SimpleTranslation>();
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 20) break;
		const rangeData: SimpleTranslation[] = await pullRange(page, pageSize);
		if (!rangeData || rangeData.length === 0) break;

		// Generate keys and add to Map
		rangeData.forEach((item) => {
			const key = generateKey([item.language, item.original, item.translation]);
			allData.set(key, item);
		});

		if (rangeData.length < pageSize) break;
		page++;
	}

	return allData;
}

export async function getExistingVariableTranslations(
	table: VariableTranslationTable,
	language: TranslationLanguage
): Promise<Map<string, VariableTranslation>> {
	async function pullRange(page: number, pageSize: number): Promise<VariableTranslation[]> {
		const { data, error } = await supabase
			.from(table)
			.select('variable_id, original, translation, form, section')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			console.error('Error fetching ' + table, error);
			return [];
		}

		const range_data: VariableTranslation[] = data.map((item) => ({
			language: language,
			original: item.original,
			translation: item.translation,
			variable_id: item.variable_id,
			form: item.form,
			section: item.section
		}));

		return range_data;
	}

	const allData = new Map<string, VariableTranslation>();
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 20) break;
		const rangeData: VariableTranslation[] = await pullRange(page, pageSize);
		if (!rangeData || rangeData.length === 0) break;

		// Generate keys and add to Map
		rangeData.forEach((item) => {
			const key = generateKey([item.variable_id, item.language, item.original, item.translation]);
			allData.set(key, item);
		});

		if (rangeData.length < pageSize) break;
		page++;
	}

	return allData;
}

// Insert new items from ARC-Translations into supabase Lists table
export async function insertListItems(items: ListTranslation[]) {
	console.log('insterting ' + items.length + ' items to supabase');
	if (items.length === 0) return; // Avoid making an unnecessary request

	const { error } = await supabase.from('lists').insert(items);

	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}

	return;
}
// Insert new items from ARC-Translations into supabase Lists table
export async function insertQuestionItems(items: VariableTranslation[]) {
	console.log('insterting ' + items.length + ' items to supabase');
	if (items.length === 0) return; // Avoid making an unnecessary request

	const { error } = await supabase.from('questions').insert(items);

	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}

	console.log('success!');

	return;
}

export async function insertTranslations(
	table: SimpleTranslationTable,
	translations: Map<string, SimpleTranslation>
): Promise<void | Error>;
export async function insertTranslations(
	table: VariableTranslationTable,
	translations: Map<string, VariableTranslation>
): Promise<void | Error>;
export async function insertTranslations(
	table: SimpleTranslationTable | VariableTranslationTable,
	translations: Map<string, SimpleTranslation> | Map<string, VariableTranslation>
): Promise<void | Error> {
	console.log('inserting ' + translations.size + ' items to supabase');
	if (translations.size === 0) return;
	const { error } = await supabase.from(table).insert(Array.from(translations.values()));
	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}
	console.log('success!');
	return;
}