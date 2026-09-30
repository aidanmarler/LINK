import { supabase } from '../../supabaseClient';
import type { LinkPreset, OriginalSegmentRow } from './types';

// Function to map csvEnglish ARCHData to OriginalSegmentInsert Type

export async function pullAllOriginalSegments(
	_version: string = '1.1.5',
	preset?: LinkPreset,
	eqListItem?: boolean, //'listItem' | 'exclude-listItem' | null,
	answerOption?: boolean
) {
	// == Handle Query == //
	// + initialize query
	const baseQuery = supabase.from('original_segments').select('*');

	// # Intial query contains most recent version
	//baseQuery.contains('arc_versions', [version]);

	// # Apply listItem filter, if not null
	if (eqListItem === true) baseQuery.eq('type', 'listItem');
	else if (eqListItem === false) baseQuery.neq('type', 'listItem');

	// # Apply listItem filter, if not null
	// if (answerOption === true) query = query.eq('type', 'answerOption'); else
	if (answerOption === false) baseQuery.neq('type', 'answerOption');

	// # Add preset filter to query, if not null
	if (preset) {
		// Get if preset is null, 'always-show', or given preset is in list
		baseQuery.or(
			`presets.cs.{${preset}},` +
				`presets.cs.{always-show},` +
				`and(presets->0.is.null,type.eq.answerOption)`
		);
	}

	// + Intialize query values
	const segments: OriginalSegmentRow[] = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	// == pagination loop
	while (hasMore) {
		try {
			const query = baseQuery.range(page * pageSize, (page + 1) * pageSize - 1);
			const { data, error: fetchError } = await query;

			// ! catch error
			if (fetchError) throw new Error('Error fetching original segments:', fetchError);

			// == if data, store it and continue
			if (data) {
				segments.push(...data);
				hasMore = data.length === pageSize;
				page++;
			}
			// If no data, stop loop and return
			else hasMore = false;
		} catch (error) {
			// ! log error
			console.error(error);
			return [];
		}
	}

	// == Return segment rows == //
	return segments as OriginalSegmentRow[];
}

export async function pullSomeOriginalSegments(ids: number[]) {
	// == Handle Query == //
	// + initialize query
	const baseQuery = supabase.from('original_segments').select('*').in('id', ids);

	// + Intialize query values
	const segments: OriginalSegmentRow[] = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	// == pagination loop
	while (hasMore) {
		try {
			const query = baseQuery.range(page * pageSize, (page + 1) * pageSize - 1);
			const { data, error: fetchError } = await query;

			// ! catch error
			if (fetchError) throw new Error('Error fetching original segments:', fetchError);

			// == if data, store it and continue
			if (data) {
				segments.push(...data);
				hasMore = data.length === pageSize;
				page++;
			}
			// If no data, stop loop and return
			else hasMore = false;
		} catch (error) {
			// ! log error
			console.error(error);
			return [];
		}
	}

	// == Return segment rows == //
	return segments as OriginalSegmentRow[];
}
