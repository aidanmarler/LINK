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

export function findNextSegment(
	locationTree: LocationNode,
	segmentMap: SegmentMap,
	startingRoute: string,
	startLocation?: LocationNode
) {
	let startSearch = false;
	if (!startLocation) startSearch = true;
	for (const [id, segment] of Object.entries(segmentMap)) {
		const numericId = Number(id);

		if (!startSearch) {
			if (startLocation?.segmentIds.includes(numericId)) {
				startSearch = true;
			}
		} else {
			if (segment.translationProgress && !startLocation?.segmentIds.includes(numericId)) {
				//console.log(segment);
				const step = segment.translationProgress.translation_step;
				if (step == 'forward' && !segment.forwardTranslation) {
					// find slug
					//console.log('go to:', segment);
					return getSegmentSlug(numericId, locationTree, startingRoute);
				}
			}
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
