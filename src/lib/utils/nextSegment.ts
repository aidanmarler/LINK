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
// location, form, label
function initalizePath(root: LocationNode, startingLocation: string[]): LocationNode[] {
	let current: LocationNode = root;
	const path: LocationNode[] = [root];
	for (const key of startingLocation) {
		const value = current.children.get(key);
		if (!value) return path;
		current = value;
		path.push(value);
	}
	return path;
}

// unconditional: we only ever call this once, right after arriving at `node`
// via a fresh down/sideways move, so its children are guaranteed unexplored.
const firstUnexploredChild = (node: LocationNode, forward: boolean): LocationNode | undefined => {
	const children = Array.from(node.children.values());
	if (children.length === 0) return undefined;
	return forward ? children[0] : children[children.length - 1];
};

// index-based: find node's position among its parent's children, step +1/-1.
const nextSibling = (path: LocationNode[], forward: boolean): LocationNode | undefined => {
	if (path.length < 2) return undefined; // root has no siblings
	const parent = path[path.length - 2];
	const node = path[path.length - 1];
	const siblings = Array.from(parent.children.values());
	const idx = siblings.indexOf(node);
	const target = siblings[idx + (forward ? 1 : -1)];
	return target;
};

function traverse(path: LocationNode[], forward: boolean): LocationNode[] | undefined {
	const node = path[path.length - 1];
	console.log("trying:", node.name);

	if (node.segmentIds.length > 0) {
		console.log("success!", node.name);
		return path;
	}

	// 1. deeper
	const down = firstUnexploredChild(node, forward);
	if (down) return traverse([...path, down], forward);

	// 2. sideways — try at this level, then climb and try again, etc.
	let climb = path;
	while (climb.length > 1) {
		const sib = nextSibling(climb, forward);
		if (sib) return traverse([...climb.slice(0, -1), sib], forward);
		climb = climb.slice(0, -1); // 3. out
	}

	return undefined; // exhausted the whole tree
}

export function initializeTraversal(locationTree: LocationNode, startingLocation: string[], forward: boolean) {
	const path = initalizePath(locationTree, startingLocation);
	console.log("Initialized traverse!", path.map(n => n.name), forward);

	// don't let the starting node itself count as a hit — start the search
	// from its first child / next sibling instead
	const node = path[path.length - 1];
	const down = firstUnexploredChild(node, forward);
	if (down) return traverse([...path, down], forward);

	let climb = path;
	while (climb.length > 1) {
		const sib = nextSibling(climb, forward);
		if (sib) return traverse([...climb.slice(0, -1), sib], forward);
		climb = climb.slice(0, -1);
	}
	return undefined;
}

export function findNextSegment(
	locationTree: LocationNode,
	segmentMap: SegmentMap,
	startingRoute: string,
	target: 'forward' | 'review',
	startLocation?: LocationNode
): [string | null, 'forward' | 'review', string | null] | undefined {
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

			console.log('label', segment, locationTree);

			// == Searching is Over! == //
			return [slug, target, 'label'] as const;
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

export function getSegmentSlug(
	segmentId: number,
	locationTree: LocationNode,
	startingRoute: string
): string | null {
	//console.log("startingRoute", startingRoute)
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

/*

Re-writing "next segment again!"

We should store a list of all segments, therefore clearly ordered. 
We should essentially be on segment[i], next = i+1, back = i-1

*/
