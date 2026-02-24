import type { ARCHData } from '$lib/types';
import { supabase } from '../../supabaseClient';
import type { LinkPreset, OriginalSegmentInsert, OriginalSegmentRow } from './types';

// Function to map csvEnglish ARCHData to OriginalSegmentInsert Type
export async function MapListToOriginalSegmentInsert(
	version: string,
	list: string,
	listData: { [sublist: string]: string[][] },
	listPresetMap: { [sublist: string]: Record<string, string[]> }
) {
	list = list.trim();
	const allInserts: OriginalSegmentInsert[] = [];
	for (let sublist in listData) {
		sublist = sublist.trim();

		const presetMap = listPresetMap[sublist];

		const inserts: OriginalSegmentInsert[] = listData[sublist].map((item) => {
			const segment = item[0].trim();
			const baseLocation = ['Lists', list, sublist, segment];
			return {
				arc_versions: [version],
				segment: segment,
				type: 'listItem',
				location: baseLocation,
				presets: presetMap[segment]
			};
		});
		allInserts.push(...inserts);
	}
	return allInserts;
}

export async function MapArchToOriginalSegmentInsert(
	version: string,
	archData: ARCHData,
	arcPresetMap: Record<string, string[]>
) {
	const answersAdded = new Set<string>();
	const formsAdded = new Set<string>();
	const sectionsAdded = new Set<string>();
	const inserts: OriginalSegmentInsert[] = Object.entries(archData).flatMap(
		([variable, details]) => {
			details.form = details.form.trim();
			details.section = details.section.trim();
			details.question = details.question.trim();
			details.definition = details.definition.trim();
			details.completionGuide = details.completionGuide.trim();
			const basePresets = arcPresetMap[variable];
			const baseLocation = ['ARC', details.form, details.section, variable].filter(Boolean);
			const segments: OriginalSegmentInsert[] = [
				// Question
				{
					arc_versions: [version],
					segment: details.question,
					type: 'question',
					location: baseLocation,
					presets: basePresets
				},
				// Definition
				{
					arc_versions: [version],
					segment: details.definition,
					type: 'definition',
					location: baseLocation,
					presets: basePresets
				},
				// Completion Guide
				{
					arc_versions: [version],
					segment: details.completionGuide,
					type: 'completionGuide',
					location: baseLocation,
					presets: basePresets
				}
			];

			// Form Label
			if (details.form.length > 0 && !formsAdded.has(details.form)) {
				formsAdded.add(details.form);
				segments.push({
					arc_versions: [version],
					segment: details.form,
					type: 'formLabel',
					location: ['ARC', details.form, 'Labels'],
					presets: ['always-show']
				});
			}

			// Section Label
			if (details.section.length > 0 && !sectionsAdded.has(details.section)) {
				sectionsAdded.add(details.section);
				segments.push({
					arc_versions: [version],
					segment: details.section,
					type: 'sectionLabel',
					location: ['ARC', details.form, 'Labels'],
					presets: ['always-show']
				});
			}

			// Add answer options if they exist
			if (details.answerOptions) {
				// Add answer options to the question segment
				const answerOptionsArray = Object.values(details.answerOptions);
				segments[0].answer_options = answerOptionsArray;

				// Add individual answer option segments
				//Answer Options
				for (const answerText of answerOptionsArray) {
					if (!answersAdded.has(answerText.trim())) {
						segments.push({
							arc_versions: [version],
							segment: answerText.trim(),
							type: 'answerOption',
							location: null,
							presets: []
						});
						answersAdded.add(answerText.trim());
					}
				}
			}

			return segments;
		}
	);

	return inserts;
}

export async function UpdateOriginalSegments(
	version: string,
	allOriginalSegments: OriginalSegmentInsert[]
) {
	console.log('1 finish -> All Original Segments to process', allOriginalSegments);

	/* Step 2: Pull Original Segments from Supabase, check what needs added and updated */

	// 2. Get all existing segments from Supabase with pagination
	console.log('2 start -> Fetching existing segments from Supabase...');

	const existingSegments = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		const { data, error: fetchError } = await supabase
			.from('original_segments')
			.select('id, segment, type, location, answer_options, arc_versions')
			.range(page * pageSize, (page + 1) * pageSize - 1);

		if (fetchError) {
			console.error('Error fetching existing segments:', fetchError);
			return { error: fetchError };
		}

		if (data) {
			existingSegments.push(...data);
			hasMore = data.length === pageSize;
			page++;
		} else {
			hasMore = false;
		}
	}

	console.log('2 finish -> Total existing segments:', existingSegments);

	// Create a lookup map for faster matching to segment|type|location|answer_options
	const existingMap = new Map(
		existingSegments.map((seg) => [
			`${seg.segment}|${seg.type}|${seg.location ?? ''}|${seg.answer_options ?? ''}`,
			seg
		])
	);

	console.log('existingMap', existingMap);

	const toInsert: OriginalSegmentInsert[] = [];
	const toUpdateVersion: { id: number; arc_versions: string[] }[] = [];
	const doNothing: OriginalSegmentInsert[] = [];

	for (const newSegment of allOriginalSegments) {
		const key = `${newSegment.segment}|${newSegment.type}|${newSegment.location ?? ''}|${newSegment.answer_options ?? ''}`;
		const existing = existingMap.get(key);

		if (!existing) {
			// Brand new segment
			if (newSegment.presets == null) newSegment.presets = [];
			if (newSegment.presets == null) console.log('null', newSegment);

			toInsert.push(newSegment);
		} else {
			// Exists - check if we need to add this arc_version
			if (!existing.arc_versions.includes(version)) {
				toUpdateVersion.push({
					id: existing.id,
					arc_versions: [...existing.arc_versions, version]
				});
			}
			// else: already has this version, skip
			else {
				doNothing.push(newSegment);
			}
		}
	}

	console.log('toInsert', toInsert);
	console.log('toUpdateVersion', toUpdateVersion);
	console.log('doNothing', doNothing);
	console.log(
		`Total processed: ${toInsert.length + toUpdateVersion.length + doNothing.length} (should equal ${allOriginalSegments.length})`
	);

	/* Step 3: Add and Update Supabase Original Segments */

	// Batch insert new segments
	if (toInsert.length > 0) {
		const { error: insertError } = await supabase.from('original_segments').insert(toInsert);

		if (insertError) {
			console.error('Insert error:', insertError);
			return { error: insertError };
		}
		console.log(`Inserted ${toInsert.length} new segments.`);
	}

	// Batch update existing segments
	if (toUpdateVersion.length > 0) {
		// Supabase doesn't support bulk updates easily, so we'll need to do this in chunks
		// or use a PostgreSQL function. For now, Promise.all works:
		const updatePromises = toUpdateVersion.map((update) =>
			supabase
				.from('original_segments')
				.update({ arc_versions: update.arc_versions })
				.eq('id', update.id)
		);

		const results = await Promise.all(updatePromises);
		const errors = results.filter((r) => r.error);
		if (errors.length > 0) {
			console.error('Update errors:', errors);
		}
		console.log(`Updated ${toUpdateVersion.length} existing segments.`);
	}

	return { inserted: toInsert.length, updated: toUpdateVersion.length, unchanged: doNothing.length };
}

export async function pullOriginalSegments(
	listItem?: boolean,//'listItem' | 'exclude-listItem' | null,
	answerOption?: boolean,
	preset?: LinkPreset,
	
) {
	const segments: OriginalSegmentRow[] = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		let query = supabase.from('original_segments').select('*');

		// TEST // Intial query contains most recent version
		query = query.contains('arc_versions', ['1.2.0']);

		// Apply listItem filter if provided
		if (listItem === true) {
			//console.log("type must be listItem!");
			query = query.eq('type', 'listItem');
		} else if (listItem === false) {
			//console.log("type must NOT be listItem!");
			query = query.neq('type', 'listItem');
		}

		// Apply listItem filter if provided
		if (answerOption === true) {
			//console.log("type must be answerOption!");
			//query = query.eq('type', 'answerOption');
		} else if (answerOption === false) {
			//console.log("type must NOT be answerOption!");
			query = query.neq('type', 'answerOption');
		}

		// How do we ignore presets if type answerOption?

		// Add preset filter to query
		if (preset) {
			// Get if preset is null, 'always-show', or given preset is in list
			query = query.or(
				`presets.cs.{${preset}},` +
					`presets.cs.{always-show},` +
					//`and(presets->0.is.null,type.eq.listItem),` +
					`and(presets->0.is.null,type.eq.answerOption)`
			);
		}

		const { data, error: fetchError } = await query.range(
			page * pageSize,
			(page + 1) * pageSize - 1
		);

		if (fetchError) {
			console.error('Error fetching existing segments:', fetchError);
			return []; // { error: fetchError };
		}

		if (data) {
			segments.push(...data);
			hasMore = data.length === pageSize;
			page++;
		} else {
			hasMore = false;
		}
	}

	return segments as OriginalSegmentRow[];
}

export async function pullOriginalAnswerSegments(segmentsToFind:string[]) {
	const segments: OriginalSegmentRow[] = [];
	const pageSize = 1000;
	let page = 0;
	let hasMore = true;

	while (hasMore) {
		const query = supabase.from('original_segments').select('*').in('segment', segmentsToFind);

		const { data, error: fetchError } = await query.range(
			page * pageSize,
			(page + 1) * pageSize - 1
		);

		if (fetchError) {
			console.error('Error fetching existing segments:', fetchError);
			return [];
		}

		if (data) {
			segments.push(...data);
			hasMore = data.length === pageSize;
			page++;
		} else {
			hasMore = false;
		}
	}

	return segments as OriginalSegmentRow[];
}

