import type { TranslationLanguage } from '$lib/types';
import { buildLocationTree, computeCompletion, type LocationNode } from '$lib/utils/locationTree';
import { createSlugMapping } from '$lib/utils/slug';
import type { LayoutLoad } from './$types';
//import { redirect } from '@sveltejs/kit';

import type {
	DocumentRow,
	ForwardTranslationRow,
	SegmentMap,
	TranslationProgressRow,
	TranslationReviewRow
} from '$lib/supabase/types';
import { pullOriginalRowsById, pullRowsForOriginalId } from '$lib/supabase/utils';
import { supabase } from '../../supabaseClient';
import { redirect } from '@sveltejs/kit';

export const ssr = false; // Force client-side for authentication

const timeStamps: number[] = [];
const printTime = (timeStamp: number) => {
	timeStamps.push(timeStamp);
	const A = timeStamps.at(-1);
	const B = timeStamps.at(-2);
	if (A && B) console.log(A - B);
};

export const load: LayoutLoad = async ({ parent }) => {
	printTime(performance.now());

	const { session, profile } = await parent();

	// @ still need to fix this! with redirect, can't log in. Without, stuck always refreshing.
	console.log('session, profile:', session, profile);
	printTime(performance.now());

	// ! catch not logged in
	if (!session || !profile) redirect(302, '/login');

	// + Get User's language and document
	const language = profile.language as TranslationLanguage;
	const selectedDocument = profile.selected_preset;
	console.log('selectedDocument:', selectedDocument);

	let document: DocumentRow | null = null;

	// * get my document
	if (selectedDocument) {
		const myDocumentRow = await supabase
			.from('documents')
			.select('*')
			.eq('title', selectedDocument)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (myDocumentRow) document = myDocumentRow.data;
	} // * if I don't have one, get default document
	else {
		const defaultDocumentRow = await supabase
			.from('documents')
			.select('*')
			.eq('title', 'ARC')
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (defaultDocumentRow.data) document = defaultDocumentRow.data;
	}

	// * if still failed to get a document, get the first one it can find.
	if (document == null) {
		const defaultDocumentRow = await supabase.from('documents').select('*').limit(1).single();
		if (defaultDocumentRow.data) document = defaultDocumentRow.data;
	}

	console.log('LayoutLoad complete');
	printTime(performance.now());

	return {
		profile,
		dataPromise: loadDataProgressively(session.user.id, language, document)
	};
};

async function loadDataProgressively(
	userId: string,
	language: TranslationLanguage,
	document: DocumentRow | null
) {
	console.log('loadDataProgressively');
	printTime(performance.now());
	const segmentMap: SegmentMap = {};
	const original_ids = document ? document.original_ids : [];

	// = ( 1 ) = Promise.all data --  Paginated and broken up for the given segmentIds.
	const [
		original_segments,
		translation_progress,
		forward_translations,
		translation_reviews,
		document_rows
	] = await Promise.all([
		pullOriginalRowsById(original_ids),
		pullRowsForOriginalId<TranslationProgressRow>('translation_progress', original_ids, language),
		pullRowsForOriginalId<ForwardTranslationRow>(
			'forward_translations',
			original_ids,
			undefined,
			userId
		),
		pullRowsForOriginalId<TranslationReviewRow>(
			'translation_reviews',
			original_ids,
			undefined,
			userId
		),
		await supabase.from('documents').select('id, title, version')
	]);
	console.log("pulled all data")
	printTime(performance.now());

	// = ( 2 ) = Create Segment map from original segments
	(original_segments || []).forEach((segment) => {
		// @ not really about presets, this just creates a map to put translation data with an original segment
		segmentMap[segment.id] = {
			originalSegment: segment,
			translationProgress: undefined as never,
			forwardTranslation: null,
			translationReview: null
		};
	});

	// = ( 3 ) = Build location tree and slug mapping
	const locationTree = buildLocationTree(original_segments || []);
	const slugMapping = createSlugMapping(original_segments || []);

	// * Add progress to segmentMap
	(translation_progress || []).forEach((t) => {
		if (segmentMap[t.original_id]) {
			segmentMap[t.original_id].translationProgress = t;
		}
	});

	// * Add translations to segmentMap
	(forward_translations || []).forEach((ft) => {
		if (segmentMap[ft.original_id]) {
			segmentMap[ft.original_id].forwardTranslation = ft;
		}
	});

	// * Add reviews to the segmentMap
	(translation_reviews || []).forEach((review) => {
		if (segmentMap[review.original_id]) {
			segmentMap[review.original_id].translationReview = review;
		}
	});

	// = ( 4 ) = Compute completion for all nodes
	function computeNodeCompletions(node: LocationNode) {
		node.completion = computeCompletion(node, segmentMap);
		node.children.forEach((child) => computeNodeCompletions(child));
	}
	computeNodeCompletions(locationTree);

	// = ( 5 ) = Map documents by title
	const documentMap: Record<string, { id: number; title: string; version: string }[]> = {};
	if (document_rows.data) {
		for (const document of document_rows.data) {
			if (!documentMap[document.title]) documentMap[document.title] = [];
			documentMap[document.title].push(document);
		}
	}
	console.log("complete")
	printTime(performance.now());

	return {
		segmentMap,
		locationTree,
		slugMapping,
		documentMap
	};
}

/*
	@ to-do after (1) updating how arc is pulled in && (2) getting segment_ids[] on layout load
	[ ] Promise.all from Original_segment ids for os, ft, tr, tp
	 ✓  Build segment map
 	 ✓  location tree
	 ✓  slug mapping
	 ✓  calculate completions
	*/

// = ( 1 ) = Load original segments

// @ will change to just pull original_ids[] with paginate query, no focus on version or preset, although they are stored.
// @ will also put below as part of promise all
//const original_segments = await pullOriginalSegments(undefined, undefined);
//timeStamp[1] = performance.now();
//console.log('original_segments found in', timeStamp[1] - timeStamp[0], 'ms');

/*
old code

	// !-- Gets all progress when should only get ones for loaded original segments, and should paginate
	const translation_progress = await pullTranslationProgressForSegments(language, segmentIds);

	// Get all of users forward translations
	const ft_query = supabase.from('forward_translations').select('*').eq('user_id', userId);
	const { data: forward_translations } = await paginateQuery(ft_query, 1000);

	// Get all of users reviews
	const review_query = supabase.from('translation_reviews').select('*').eq('reviewer_id', userId);
	const { data: translation_reviews } = await paginateQuery(review_query, 1000);
*/

/*

	To do this, we need to load all items from superbase that have an id in SegmentMap and are this language - IE, all reviews for a given segment

	Actually, we care about if the user has completed a translation, just them, and then ALL translations separately.
	Unique to user if "original_id & language & user"... really just "original_id & user", but then we double check it is the right language, just to be safe

	What is the process?
		1. Pull all ForwardTranslations for a given segment and language
			* this is to show all options to select from
		2. Pull all TranslationReviews for a given segment and language
			* this is to show all comments made thus far on them by reviewers


	In one review, a user will look at all questions, make comments about them that they find to be true "oh this one is wrong this way, or this one is wrong this way"
	*/

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
