import type { OriginalSegmentRow, SegmentMap } from '$lib/supabase/types';
import { createLabel, createSlug } from './slug';

export interface LocationNode {
	name: string;
	slug: string;
	children: Map<string, LocationNode>;
	segmentIds: number[];
	completion: LocationCompletion;
}

export interface LocationCompletion {
	forwardComplete: number;
	reviewComplete: number;
	backwardComplete: number;
	forwardNeeded: number;
	reviewNeeded: number;
	backwardNeeded: number;
}

export function buildLocationTree(segments: OriginalSegmentRow[]): LocationNode {
	const root: LocationNode = {
		name: 'root',
		slug: '',
		children: new Map(),
		segmentIds: [],
		completion: {
			forwardComplete: 0,
			reviewComplete: 0,
			backwardComplete: 0,
			forwardNeeded: 0,
			reviewNeeded: 0,
			backwardNeeded: 0
		}
	};

	segments.forEach((segment) => {
		if (!segment.location || segment.location.length === 0) return;

		let currentNode = root;

		// Build path through tree
		segment.location.forEach((locationName, index) => {
			const slug = createSlug(locationName);
			const label = createLabel(locationName);

			if (!currentNode.children.has(slug)) {
				currentNode.children.set(slug, {
					name: label,
					slug: slug,
					children: new Map(),
					segmentIds: [],
					completion: {
						forwardComplete: 0,
						reviewComplete: 0,
						backwardComplete: 0,
						forwardNeeded: 0,
						reviewNeeded: 0,
						backwardNeeded: 0
					}
				});
			}

			currentNode = currentNode.children.get(slug)!;

			// Add segment to the deepest node in its path
			if (index === segment.location!.length - 1) {
				currentNode.segmentIds.push(segment.id);
				if (segment.type === 'question' && segment.segment) {
					currentNode.name = segment.segment;
				}
			}
		});
	});

	return root;
}

export function computeCompletion(node: LocationNode, segmentMap: SegmentMap): LocationCompletion {
	// Get all relevant segment IDs (including descendants)
	const allIds = getAllDescendantIds(node);

	const completion: LocationCompletion = {
		forwardComplete: 0,
		reviewComplete: 0,
		backwardComplete: 0,
		forwardNeeded: 0,
		reviewNeeded: 0,
		backwardNeeded: 0
	};

	allIds.forEach((id) => {
		const segment = segmentMap[id];
		if (!segment) return;

		// Check forward translation
		if (segment.forwardTranslation) {
			completion.forwardComplete++;
		} else {
			completion.forwardNeeded++;
		}
		
	});

	return completion;
}

function getAllDescendantIds(node: LocationNode): number[] {
	const ids = [...node.segmentIds];
	node.children.forEach((child) => {
		ids.push(...getAllDescendantIds(child));
	});
	return ids;
}
