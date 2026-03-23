import JSZip from 'jszip';
import { pullArcTranslations, type ArcVersionStructure } from './pullArcTranslations';
import Papa from 'papaparse';
import { pullLink } from './pullLink';
import { formatArc, modifyArcFromLink } from './updateArcFromLink';

// == == Zip Tree Strucure, return blob == == //
const zipFolderTree = async (tree: ArcVersionStructure): Promise<string> => {
	console.log('Zip Started');
	// + intialize zip folder
	const zip = new JSZip();
	// & zip object to const zip
	const zipObject = async (tree: Record<string, unknown>, path: string = '') => {
		for (const [name, item] of Object.entries(tree)) {
			if (name.endsWith('ARCH.csv')) {
				console.log(name, item);
				const zipPath = path + '/' + name;
				const _unparseConfig: Papa.UnparseConfig = {};
				const itemTyped = item as Record<string, unknown>;
				const unparsedItem = Papa.unparse(Object.values(itemTyped) as unknown[]);
				zip.file(zipPath, unparsedItem);
			} else if (name.endsWith('.csv')) {
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

	console.log('Zip Complete!');

	// == Return blob url == //
	return zipUrl;
};

// == == MAIN == ==
export async function exportMain(version: string) {
	// ( 1 ) pull arc
	const arc = await pullArcTranslations(version);

	// ( 2 ) pull link
	const [segments, translationData] = await pullLink(version);

	// ( 3 ) add new columns
	const formattedArc = await formatArc(arc);

	// ( 3 ) modify Arc-Translations
	const modifiedArc = await modifyArcFromLink(formattedArc, segments, translationData);

	console.log('modifiedArc', modifiedArc);

	return;

	// ( 4 ) ZIP folder
	const zipUrl = await zipFolderTree(modifiedArc);

	return zipUrl;
}
