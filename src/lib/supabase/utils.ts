import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '../../supabaseClient';
import type { TranslationLanguage } from '$lib/types';
import type { ForwardTranslationInsert, TranslationProgressInsert, TranslationReviewInsert } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Custom type to extract just the result from an incoming query, ignoring everything else
type ExtractQueryResult<T> =
	T extends PostgrestFilterBuilder<
		infer _ClientOptions,
		infer _Schema,
		infer _Row,
		infer Result,
		infer _RelationName,
		infer _Relationships,
		infer _Method
	>
		? Result
		: never;

// Generic function to paginate any query
export async function paginateQuery<
	T extends PostgrestFilterBuilder<any, any, any, any, any, any, any>
>(
	query: T,
	pageSize: number
): Promise<{ data: ExtractQueryResult<T> | null; error: Error | null }> {
	const retrievedData: ExtractQueryResult<T> = [] as any; // We'll need to cast since we're building it up
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		// Add pagination to query
		const paginatedQuery = query.range(page * pageSize, (page + 1) * pageSize - 1);

		// Get page data
		const { data, error: fetchError } = await paginatedQuery;

		// Return error case
		if (fetchError) {
			console.error('Error fetching data on page ' + page + ': ', fetchError);
			return { data: null, error: fetchError };
		}

		// If data, there is more if there were at least as many rows as pageSize
		if (data) {
			retrievedData.push(...data);
			hasMore = data.length === pageSize;
			page++;
		} else {
			hasMore = false;
		}
	}

	return { data: retrievedData, error: null };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// From any array of Rows with "created_at", compare and return the first row.
export function getEarliestEvent<T extends { created_at: string }>(rows: T[]): T {
	const earliestRow = rows.reduce((earliest, current) =>
		current.created_at < earliest.created_at ? current : earliest
	);
	return earliestRow;
}

/*
AIDAN - STREAMLINE
Comeback and streamline... maybe use overloading?
The goal is to have any insert type be accepted and insert into the correct table
*/
export async function InsertForwardTranslations(rows: ForwardTranslationInsert[]) {
	const { error: insertError } = await supabase.from('forward_translations').insert(rows);
	if (insertError) return insertError;
	return;
}
export async function InsertTranslationReviews(rows: TranslationReviewInsert[]) {
	const { error: insertError } = await supabase.from('translation_reviews').insert(rows);
	if (insertError) return insertError;
	return;
}
export async function InsertTranslationProgress(progresses: TranslationProgressInsert[]) {
	const { error: insertError } = await supabase.from('translation_progress').insert(progresses);
	if (insertError) return insertError;
	return;
}

//export async function pullRowsForOriginalId<T extends { original_id: number, language: TranslationLanguage }>(
//export async function pullRowsForOriginalId<T extends TablesWithIdAndLanguage>(

type tables = 'forward_translations' | 'translation_progress' | 'accepted_translations' | 'translation_reviews';

//const myVar: Database['public']['Tables']['translation_reviews']

export async function pullRowsForOriginalId<
	TRow extends { created_at: string; language: TranslationLanguage }
>(language: TranslationLanguage, table: tables, segmentIds: number[]): Promise<TRow[]> {
	const rows: TRow[] = [];
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
				.from(table)
				.select('*')
				.eq('language', language)
				.in('original_id', idsToCheck)
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (fetchError) {
				console.error('Error fetching existing translations:', fetchError);
				return [];
			}

			if (data) {
				rows.push(...(data as unknown as TRow[]));
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

	return rows;
}

/*
// Only allow querying from tables that have an original_id and language column
type TablesWithIdAndLanguage = {
	[K in keyof Database['public']['Tables']]: 'language' extends keyof Database['public']['Tables'][K]['Row']
		? 'original_id' extends keyof Database['public']['Tables'][K]['Row']
			? K
			: never
		: never;
}[keyof Database['public']['Tables']];

type TableNameForRow<TRow> = {
	[K in keyof Database['public']['Tables']]: Database['public']['Tables'][K]['Row'] extends TRow
		? TRow extends Database['public']['Tables'][K]['Row']
			? K
			: never
		: never;
}[keyof Database['public']['Tables']];

type RowWithIdAndLanguage = {
	original_id: number;
	language: TranslationLanguage;
};

//export async function pullRowsForOriginalId<T extends { original_id: number, language: TranslationLanguage }>(
//export async function pullRowsForOriginalId<T extends TablesWithIdAndLanguage>(
export async function pullRowsForOriginalId<
	TRow extends RowWithIdAndLanguage,
	TTable extends TableNameForRow<TRow> = TableNameForRow<TRow>
>(language: TranslationLanguage, table: TTable, segmentIds: number[]): Promise<TRow[]> {
	console.log('01 pullRowsForOriginalId', segmentIds.length);
	const rows: TRow[] = [];
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
				.from(table)
				.select('*')
				.eq('language', language)
				.in('original_id', idsToCheck)
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (fetchError) {
				console.error('Error fetching existing translations:', fetchError);
				return [];
			}

			if (data) {
				rows.push(...data);

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

	console.log('02 pullRowsForOriginalId', rows.length);
	return rows;
}
*/
