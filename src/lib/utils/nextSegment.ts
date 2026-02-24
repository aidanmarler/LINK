import type { SegmentMap } from '$lib/supabase/types';
import type { LocationNode } from './locationTree';

export function findNextSegmentOld(
	location: LocationNode,
	segmentMap: SegmentMap,
	startingRoute: string,
	startLocation?: string
): string | null {
	console.log(startLocation, location);

	// Check if current node has segments
	if (location.segmentIds != undefined && location.segmentIds.length > 0) {
		//console.log('segments found!', location.slug);
		const address = startingRoute + '/' + location.slug;
		for (const id of location.segmentIds) {
			const segment = segmentMap[id];
			// Added review or backward translate steps? Add them here!
			if (
				!segment.forwardTranslation &&
				segment.translationProgress.translation_step == 'forward'
			) {
				return address;
			}
		}
	}

	// Recursively search children
	for (const child of location.children) {
		const result = findNextSegmentOld(
			child[1],
			segmentMap,
			location.slug ? startingRoute + '/' + location.slug : startingRoute
		);
		// Return immediately when found
		if (result) return result;
	}

	// No valid segment found in this branch
	return null;
}

// Find next segment from segmentMap given a starting route,
export function findNextSegment(
	locationTree: LocationNode,
	segmentMap: SegmentMap,
	startingRoute: string,
	startLocation?: LocationNode
) {
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
			if (segment.forwardTranslation) continue;

			// == Searching is Over! == //
			return getSegmentSlug(+id, locationTree, startingRoute);
		} else {
			// if not yet starting search, start search if start location has been found
			if (startLocation?.segmentIds.includes(+id)) searching = true;
		}
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
