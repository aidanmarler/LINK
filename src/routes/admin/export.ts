import JSZip from 'jszip';
import { pullArcTranslations } from './pullArcTranslations';
import Papa from 'papaparse';
import { pullOriginalSegments } from '$lib/supabase/originalTranslations';
import type { OriginalSegmentRow } from '$lib/supabase/types';

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

// == == Pull LINK for version == == //
const pullLinkForExport = async (version: string) => {
    console.log("Pulling LINK")
	// = ( 1 ) = pull original segments
	const originalSegmentList = await pullOriginalSegments(version);
	// * map to id
	const originalSegments: Record<number, OriginalSegmentRow> = Object.fromEntries(
		originalSegmentList.map((segment) => [segment.id, segment])
	);
	console.log(originalSegments);

	// = ( 2 ) = promise.all -> accepted_translations, forward_translations, translation_reviews, translation_progress.

};

// == == MAIN == ==
export async function exportMain(version: string) {
	await pullLinkForExport(version);
	return;

	// ( 1 ) pull arc
	const arc = await pullArcTranslations(version);

	// ( 2 ) pull link
	await pullLinkForExport(version);

	// ( 3 ) modify arc

	// ( 4 ) ZIP folder
	const zipUrl = await zipFolderTree(arc);

	return zipUrl;
}
