import JSZip from 'jszip';
import { pullArcTranslations } from './pullArcTranslations';
import Papa from 'papaparse';

//type CsvData = Record<string, unknown[]>;

async function zipFolderTree(tree: Record<string, unknown>) {
	// + intialize zip folder
	const zip = new JSZip();

	// * zip object
	function zipObject(tree: Record<string, unknown>, path: string = '') {
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
	}

	zipObject(tree);

	//console.log(zip);

	const zipBlob = await zip.generateAsync({ type: 'blob' });

	//console.log(zipBlob);

	const zipUrl = URL.createObjectURL(zipBlob);

	return zipUrl;
}

// == == MAIN == ==
export async function exportMain(version: string) {
	// ( 1 ) pull arc
	const arc = await pullArcTranslations(version);

	// ( 2 ) pull link

	// ( 3 ) modify arc

	// ( 4 ) ZIP folder
	const zipUrl = await zipFolderTree(arc);

	console.log('zipUrl', zipUrl);
	return zipUrl;
}
