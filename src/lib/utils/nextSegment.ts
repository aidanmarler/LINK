import type { SegmentMap } from '$lib/supabase/types';
import type { LocationNode } from './locationTree';

/*
Current:
for each segment,
if has hit "starting segment", start searching
once has found a segment that is missing a forward translation, 
	slug = getslug( segment )
	return slug

New:
for each segment,
if has hit "starting segment", start searching.
	if ( forwardState )
		get first segment that is in state forward missing a forward segment
	if ( reviewState || forwardState failed )
		get first segment that is in review state missing a review
	slug = getslug( segment )
	form = getform( segment ) ( ForwardTranslate, Review , BackwardTranslate )

*/

// Find next segment from segmentMap given a starting route,
export function findNextSegment(
	locationTree: LocationNode,
	segmentMap: SegmentMap,
	startingRoute: string,
	target: 'forward' | 'review',
	startLocation?: LocationNode
): [string | null, 'forward' | 'review'] | undefined {
	// Searching: is currently searching for next incomplete segment
	let searching = false;
	if (!startLocation) searching = true;

	// Itereate through every entry of segmentMap
	for (const [id, segment] of Object.entries(segmentMap)) {
		if (searching) {
			// - skip location if this is the starting location
			if (startLocation?.segmentIds.includes(+id)) continue;
			// - skip if this is an answer option... they do not actually have a location
			if (segment.originalSegment.type == 'answerOption') continue;
			// - if no forward translation, this is the next to go to
			if (target == 'forward') {
				if (segment.forwardTranslation) continue;
				if (segment.translationProgress.translation_step !== 'forward') continue;
			}
			// - if no forward translation, this is the next to go to
			else if (target == 'review') {
				if (segment.translationReview) continue;
				if (segment.translationProgress.translation_step !== 'review') continue;
			}

			// * get segment slug
			const slug = getSegmentSlug(+id, locationTree, startingRoute);

			// == Searching is Over! == //
			return [slug, target] as const;
		} else {
			// if not yet starting search, start search if start location has been found
			if (startLocation?.segmentIds.includes(+id)) searching = true;
		}
	}

	// if got to end, start again with no start location if had start location
	// if got to end without start location and in forward, try ag
	if (target == 'forward') {
		return findNextSegment(locationTree, segmentMap, startingRoute, 'review', startLocation);
	} else if (startLocation) {
		return findNextSegment(locationTree, segmentMap, startingRoute, 'review');
	}
}

function getSegmentSlug(
	segmentId: number,
	locationTree: LocationNode,
	startingRoute: string
): string | null {
	const address = startingRoute + '/' + locationTree.slug;
	//console.log('searching... ', address);
	// Check if current node has segments
	if (locationTree.segmentIds != undefined && locationTree.segmentIds.length > 0) {
		//console.log(segmentId, typeof segmentId, location.segmentIds, typeof location.segmentIds[0]);
		//console.log(segmentId, location.segmentIds);
		// This line here isn't working because I can see it in the print statements but it doesn't return it
		if (locationTree.segmentIds.includes(segmentId)) {
			//console.log('Found ID!');
			return address;
		}
	}

	// Recursively search children
	for (const child of locationTree.children) {
		const result = getSegmentSlug(
			segmentId,
			child[1],
			locationTree.slug ? startingRoute + '/' + locationTree.slug : startingRoute
		);
		// Return immediately when found
		if (result) return result;
	}

	// No valid segment found in this branch
	return null;
}
