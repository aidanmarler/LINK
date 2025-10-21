import type { OriginalSegmentRow } from '$lib/supabase/types';

// src/lib/utils/slugify.ts
export function createSlug(locationString: string): string {
	// Take everything before ":" if it exists
	const beforeColon = locationString.split(':')[0].trim();

	// Convert to slug: lowercase, replace spaces/special chars with hyphens
	return beforeColon
		.toLowerCase()
		.replace(/[^\w\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single
		.trim();
}

export function createSlugMapping(segments: OriginalSegmentRow[]): Map<string, string> {
	const mapping = new Map<string, string>();

	segments.forEach((segment) => {
		if (!segment.location) return;

		segment.location.forEach((loc) => {
			const slug = createSlug(loc);
			mapping.set(slug, loc);
		});
	});

	return mapping;
}
