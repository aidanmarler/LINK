/* Lists Initialize */
// retrieve entire table of lists with only needed columns

import { generateItemKey, tableColumns } from '$lib/dependencies';
import type {
	ListTranslation,
	BaseItem,
	TranslationLanguage,
	VariableItem,
	VariableTable,
	BaseTable,
	Item,
	Table,
	LabelTable,
	LabelItem,
	ItemForTable
} from '$lib/types';
import { supabase } from '../../supabaseClient';

// Step 1: Get Current Entries
//		To verify what needs to be uploaded to SupaBase and what we can leave
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

export async function getExistingTranslations<T extends BaseTable>(
	table: T,
	language: TranslationLanguage
): Promise<Map<string, ItemForTable<T>>>;
export async function getExistingTranslations<T extends LabelTable>(
	table: T,
	language: TranslationLanguage
): Promise<Map<string, ItemForTable<T>>>;
export async function getExistingTranslations<T extends VariableTable>(
	table: T,
	language: TranslationLanguage
): Promise<Map<string, ItemForTable<T>>>;
export async function getExistingTranslations<T extends Table>(
	table: T,
	language: TranslationLanguage
): Promise<Map<string, ItemForTable<T>>> {
	console.log('getting existing supabase translations in ', table, language);
	async function pullRange(page: number, pageSize: number): Promise<ItemForTable<T>[]> {
		const columns = tableColumns[table].join(', ') as '*';
		const { data, error } = await supabase
			.from(table)
			.select(columns) // use table columns (2)
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			console.error('Error fetching ' + table, error);
			return [];
		}

		return data.map((item) => ({
			...item
		})) as ItemForTable<T>[];
	}

	const allData = new Map<string, ItemForTable<T>>(); // (1)
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 40) {
			console.error('Error: found over 40,000 rows in ' + table);
			break;
		}
		const rangeData = await pullRange(page, pageSize);
		if (!rangeData || rangeData.length === 0) break;

		rangeData.forEach((item) => {
			const key = generateItemKey(table, item);
			allData.set(key, item);
		});

		if (rangeData.length < pageSize) break;
		page++;
	}

	return allData;
}

// Step 2: Insert new items
//		From ARC-Translations GitHub to Supabase table
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

// Insert Translations into Supabase of specified type for table.
export async function insertTranslations(
	table: BaseTable,
	translations: Map<string, BaseItem>
): Promise<void | Error>;
export async function insertTranslations(
	table: LabelTable,
	translations: Map<string, LabelItem>
): Promise<void | Error>;
export async function insertTranslations(
	table: VariableTable,
	translations: Map<string, VariableItem>
): Promise<void | Error>;
export async function insertTranslations(
	table: Table,
	translations: Map<string, Item>
): Promise<void | Error> {
	console.log('inserting ' + translations.size + ' items into ' + table);
	if (translations.size === 0) return;
	const { error } = await supabase.from(table).insert(Array.from(translations.values()));
	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}
	console.log('success!');
	return;
}
