import { supabase } from '../../supabaseClient';
import type { TranslationLanguage } from '$lib/types';
import { buildLocationTree, computeCompletion, type LocationNode } from '$lib/utils/locationTree';
import { createSlugMapping } from '$lib/utils/slug';
import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { pullOriginalSegments } from '$lib/supabase/originalTranslations';
import type { LinkPreset, SegmentMap } from '$lib/supabase/types';
import { presetOptions } from '$lib/supabase/presets';

export const ssr = false; // Force client-side for authentication

export const load: LayoutLoad = async ({ parent }) => {
	const { session, profile } = await parent();

	if (!session || !profile) throw redirect(505, '/login');
	const language = profile.language as TranslationLanguage;

	const selectedPreset =
		profile.selected_preset && Object.values(presetOptions).includes(profile.selected_preset)
			? (profile.selected_preset as LinkPreset)
			: undefined;

	// Now we ALWAYS return data (never early return)
	return {
		profile,
		dataPromise: loadDataProgressively(session.user.id, language, selectedPreset)
	};
};

async function loadDataProgressively(
	userId: string,
	language: TranslationLanguage,
	preset: undefined | LinkPreset
) {
	const segmentMap: SegmentMap = {};

	// Step 1: Load original segments
	const original_segments = await pullOriginalSegments(undefined, preset);

	const presets: string[] = [];

	// Create base map
	(original_segments || []).forEach((segment) => {
		segmentMap[segment.id] = {
			originalSegment: segment,
			translationProgress: null as never,
			forwardTranslation: null
		};

		// Debug preset options
		if (segment.presets) {
			for (const preset of segment.presets) {
				if (segment.location) {
					//console.log(segment.location[0]);
					if (segment.location[0] == 'ARC' && !presets.includes(preset)) {
						presets.push(preset);
					}
				}
			}
		}
	});

	console.log('All presets found:', presets);

	// Build tree and mapping
	const locationTree = buildLocationTree(original_segments || []);
	const slugMapping = createSlugMapping(original_segments || []);

	// Step 2: Load translation progress
	const { data: translation_progress } = await supabase
		.from('translation_progress')
		.select('*')
		.eq('language', language);

	(translation_progress || []).forEach((t) => {
		if (segmentMap[t.original_id]) {
			segmentMap[t.original_id].translationProgress = t;
		}
	});

	// Step 3: Load forward translations
	const { data: forward_translations } = await supabase
		.from('forward_translations')
		.select('*')
		.eq('user_id', userId);

	(forward_translations || []).forEach((ft) => {
		if (segmentMap[ft.original_id]) {
			segmentMap[ft.original_id].forwardTranslation = ft;
		}
	});

	// Step 4: Compute completion for all nodes
	function computeNodeCompletions(node: LocationNode) {
		node.completion = computeCompletion(node, segmentMap);
		//console.log('Computing ' + node.name, node.completion);
		node.children.forEach((child) => computeNodeCompletions(child));
	}

	computeNodeCompletions(locationTree);

	return {
		segmentMap,
		locationTree,
		slugMapping
	};
}

/*

Next steps:
1. get and store all locations on layout load - location tree?
2. If at a location with at least one thing in it, show the form to submit instead.
3. On submit form, simply add items to forward tree.

4. Get UI from past stuff, get it pretty
5. Load stuff stategically, maybe only original items on load, pulling in then progress, forward translations, reviews, and backward translations.


NEW:
1. Load original_segments properly (map location and be done), and then return
2. After load, create new segmentMap to map original segment ids to progress, ft, reviews (get user reviews and relevent forward translations), and backward translation
	upon each loaded item, update segmentMap
3. Have child +page use segmentMap for the filtered relavent original_ids and pass that into forward_translation, reviews, and backward translations.
	So for each +page, filter data.segmentMap into pageSegmentMap

	async function fetchData() {
		if (!session || !profile) throw redirect(505, '/login');
		if (!profile.language) {
			// You could redirect or return early
			return {
				profile,
				segmentMap,
				locationTree: null,
				slugMapping: null
			};
		}
		const language = profile.language as TranslationLanguage;

		const original_segments = await pullOriginalSegments();

		// First, create a base map with all original segments
		(original_segments || []).forEach((segment) => {
			segmentMap[segment.id] = {
				originalSegment: segment,
				translationProgress: null as never, // We'll populate this next
				forwardTranslation: null
			};
		});

		// Build tree and mapping
		const locationTree = buildLocationTree(original_segments || []);
		const slugMapping = createSlugMapping(original_segments || []);

		const { data: translation_progress } = await supabase
			.from('translation_progress')
			.select('*')
			.eq('language', language);

		// Then, add translation progress data
		(translation_progress || []).forEach((t) => {
			if (segmentMap[t.original_id]) segmentMap[t.original_id].translationProgress = t;
		});

		const { data: forward_translations } = await supabase
			.from('forward_translations')
			.select('*')
			.eq('user_id', session.user.id);

		// Finally, add forward translations data
		(forward_translations || []).forEach((ft) => {
			if (segmentMap[ft.original_id]) segmentMap[ft.original_id].forwardTranslation = ft;
		});
	}

*/
