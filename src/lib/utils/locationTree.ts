import type { OriginalSegmentRow } from '$lib/supabase/types';
import { createSlug } from './slug';

// src/lib/utils/locationTree.ts
export interface LocationNode {
	name: string;
	slug: string;
	children: Map<string, LocationNode>;
	segmentIds: number[];
}

export function buildLocationTree(segments: OriginalSegmentRow[]): LocationNode {
	const root: LocationNode = {
		name: 'root',
		slug: '',
		children: new Map(),
		segmentIds: []
	};

	segments.forEach((segment) => {
		if (!segment.location || segment.location.length === 0) return;

		let currentNode = root;

		// Build path through tree
		segment.location.forEach((locationName, index) => {
			const slug = createSlug(locationName);

			if (!currentNode.children.has(slug)) {
				currentNode.children.set(slug, {
					name: locationName,
					slug: slug,
					children: new Map(),
					segmentIds: []
				});
			}

			currentNode = currentNode.children.get(slug)!;

			// Add segment to the deepest node in its path
			if (index === segment.location!.length - 1) {
				currentNode.segmentIds.push(segment.id);
			}
		});
	});

	return root;
}
