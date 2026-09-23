import type { PageLoad } from './$types';
import type { LocationNode } from '$lib/utils/locationTree';
import { error } from '@sveltejs/kit';
import { getRelatedReviews, getRelatedTranslations } from './components/review/reviewForm';
import type { TranslationLanguage } from '$lib/types';

export const ssr = false; // Force client-side for authentication

export const load: PageLoad = async ({ params, parent }) => {
	console.time('parent-wait');
	const parentData = await parent();
	
	// Wait for the data promise to resolve
	const { locationTree, segmentMap } = await parentData.dataPromise;
	console.timeEnd('parent-wait');

	console.time('fetch-kickoff');

	if (!locationTree) throw error(500, 'Location data not available');

	// params.location will be undefined for /home, or a string like "arc/program/solutions"
	const pathSegments = params.location ? params.location.split('/') : [];

	// Navigate through tree
	let currentNode: LocationNode = locationTree;
	const breadcrumbs: Array<{ name: string; slug: string; path: string }> = [];

	for (let i = 0; i < pathSegments.length; i++) {
		const slug = pathSegments[i];
		//console.log('slug...', slug);
		if (!currentNode.children.has(slug)) {
			console.log('path not found', slug);
			return {
				notFound: true,
				pathSegments
			};
		}

		currentNode = currentNode.children.get(slug)!;
		//console.log('slug found!', currentNode);
		breadcrumbs.push({
			name: currentNode.name,
			slug: slug,
			path: '/home/' + pathSegments.slice(0, i + 1).join('/')
		});
	}

	// pull related translations
	const relatedTranslations = getRelatedTranslations(
		Object.keys(segmentMap).map(Number),
		parentData.profile.language as TranslationLanguage
	);
	const relatedReviews = getRelatedReviews(
		Object.keys(segmentMap).map(Number),
		parentData.profile.language as TranslationLanguage
	);

	console.timeEnd('fetch-kickoff');
	return {
		currentNode,
		breadcrumbs,
		pathSegments,
		notFound: false,
		relatedTranslations,
		relatedReviews
	};
};
