import JSZip from 'jszip';
import { pullArcTranslations } from './pullArcTranslations';
import Papa from 'papaparse';
import { pullOriginalSegments } from '$lib/supabase/originalTranslations';
import type {
	AcceptedTranslationRow,
	ForwardTranslationRow,
	OriginalSegmentRow,
	TranslationProgressRow,
	TranslationReviewRow
} from '$lib/supabase/types';
import { pullRowsForOriginalId } from '$lib/supabase/utils';

//type CsvData = Record<string, unknown[]>;

// I am using arrow functions in this script just for practice.
// I think they make no difference to performance here, nor readability.
// But I don't use them much so I figured it would be a nice practice to use them here.

// == == Zip Tree Strucure, return blob == == //
const zipFolderTree = async (tree: Record<string, unknown>): Promise<string> => {
	// + intialize zip folder
	const zip = new JSZip();
	// & zip object to const zip
	const zipObject = async (tree: Record<string, unknown>, path: string = '') => {
		for (const [name, item] of Object.entries(tree)) {
			if (name.endsWith('.csv')) {
				const zipPath = path + '/' + name;
				const _unparseConfig: Papa.UnparseConfig = {};
				const unparsedItem = Papa.unparse(item as unknown[]);
				zip.file(zipPath, unparsedItem);
			} else {
				let newpath = path + '/' + name;
				if (path == '') newpath = name;
				zipObject(item as Record<string, unknown>, newpath);
			}
		}
	};
	// * zip object
	zipObject(tree);
	// * zip to blob
	const zipBlob = await zip.generateAsync({ type: 'blob' });
	// * blob to url
	const zipUrl = URL.createObjectURL(zipBlob);

	// == Return blob url == //
	return zipUrl;
};

type LinkStructure = Record<
	string, // language
	Record<
		number, // original_id
		{
			translationProgress?: TranslationProgressRow;
			forwardTranslations?: ForwardTranslationRow[];
			translationReviews?: TranslationReviewRow[];
			acceptedTranslations?: AcceptedTranslationRow[];
		}
	>
>;

// == == Pull LINK for version == == //
const pullLinkForExport = async (version: string) => {
	console.log('Pulling LINK; get original segments');
	// = ( 1 ) = pull original segments
	const originalSegmentList = await pullOriginalSegments(version);
	// * map to id
	const originalSegments: Record<number, OriginalSegmentRow> = Object.fromEntries(
		originalSegmentList.map((segment) => [segment.id, segment])
	);
	//console.log(originalSegments);

	/*

    from og segment list, make map
    
    */
	console.log('Pulling LINK; get all tables');
	// = ( 2 ) = promise.all -> accepted_translations, forward_translations, translation_reviews, translation_progress.
	const segmentIds: number[] = Object.keys(originalSegments).map(Number);
	const [translation_progress, forward_translations, translation_reviews, accepted_translations] =
		await Promise.all([
			pullRowsForOriginalId<TranslationProgressRow>('translation_progress', segmentIds),
			pullRowsForOriginalId<ForwardTranslationRow>('forward_translations', segmentIds),
			pullRowsForOriginalId<TranslationReviewRow>('translation_reviews', segmentIds),
			pullRowsForOriginalId<AcceptedTranslationRow>('accepted_translations', segmentIds)
		]);

	// + Init link for export
	const LINK: LinkStructure = {};

	// * Get translation_progress for this item
	for (const progress of translation_progress) {
		const lang = progress.language;
		const oID = progress.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		LINK[lang][oID] = { translationProgress: progress };
	}

	// * Get Forward Translations
	for (const translation of forward_translations) {
		const lang = translation.language;
		const oID = translation.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		if (!LINK[lang][oID]) LINK[lang][oID] = {};
		if (!LINK[lang][oID].forwardTranslations) LINK[lang][oID].forwardTranslations = [translation];
		else LINK[lang][oID].forwardTranslations.push(translation);
	}

	// * Get Translation Reviews
	for (const review of translation_reviews) {
		const lang = review.language;
		const oID = review.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		if (!LINK[lang][oID]) LINK[lang][oID] = {};
		if (!LINK[lang][oID].translationReviews) LINK[lang][oID].translationReviews = [review];
		else LINK[lang][oID].translationReviews.push(review);
	}

	// * Get Accepted Translations
	for (const accTranslation of accepted_translations) {
		const lang = accTranslation.language;
		const oID = accTranslation.original_id;
		if (!LINK[lang]) LINK[lang] = {};
		if (!LINK[lang][oID]) LINK[lang][oID] = {};
		if (!LINK[lang][oID].acceptedTranslations)
			LINK[lang][oID].acceptedTranslations = [accTranslation];
		else LINK[lang][oID].acceptedTranslations.push(accTranslation);
	}

	// == return entire LINK results in LinkStructure == //
	return LINK;
};

const modifyArcFromLink: Record<string, string | Record<string, unknown[]>> = async (
	arc: Record<string, string | Record<string, unknown[]>>,
	link: LinkStructure
) => {
	// & 

	for (const language of link){
		langData = link[language];
		for (const oId of link[language]){

		}
	}
	return arc;
};

// == == MAIN == ==
export async function exportMain(version: string) {
	// ( 1 ) pull arc
	const arc = await pullArcTranslations(version);

	// ( 2 ) pull link
	const link = await pullLinkForExport(version);

	// ( 3 ) modify arc
	const modifiedArc = await modifyArcFromLink(arc, link);

	console.log(modifiedArc);
	return;

	// ( 4 ) ZIP folder
	const zipUrl = await zipFolderTree(arc);

	return zipUrl;
}
