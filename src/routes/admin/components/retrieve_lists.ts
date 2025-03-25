// Create functions to retrieve the data from ARC-Translations repo and change the Supabase project accordingly

import { parseCSV } from '$lib/csvUtils';
import { languages } from '$lib/dependencies';
import { addTranslationToLists, insertDataIntoSupabase } from '$lib/supabaseHelpers';
import type { listTranslation } from '$lib/types';

let repoData: any = null;
let folderContents: any[] = [];
let error: string | null = null;
let isLoading: boolean = true;

// Replace with your GitHub username and repository name

const version = '1.0.3';

// Function to fetch repository data
export async function fetchRepoData(version?: string, path?: string) {
	const username = 'ISARICResearch';
	const repoName = 'ARC-Translations';
	isLoading = true;
	error = null;
	try {
		const versionPath = version ? '/ARCH' + version + '/' : '';
		const subPath = version && path ? path : '';
		const url = `https://api.github.com/repos/${username}/${repoName}/contents${versionPath}${subPath}`;
		console.log('Fetching URL:', url); // Debugging: Log the URL
		const response = await fetch(url);
		console.log('Response:', response); // Debugging: Log the response

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('Data:', data); // Debugging: Log the data

		if (Array.isArray(data)) {
			folderContents = data; // If it's a directory, store its contents

			console.log(data);
		} else {
			folderContents = [data]; // If it's a file, wrap it in an array
		}
	} catch (err: any) {
		error = err.message;
		console.error('Error fetching data:', typeof err, err); // Debugging: Log the error
	} finally {
		isLoading = false;
	}
}

async function fetchRepoDataRecursive(path: string): Promise<any[]> {
	const username = 'ISARICResearch';
	const repoName = 'ARC-Translations';
	const url = `https://api.github.com/repos/${username}/${repoName}/contents/${path}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data = await response.json();
	let results: any[] = [];

	for (const item of data) {
		if (item.type === 'dir') {
			const subDirData = await fetchRepoDataRecursive(item.path);
			results = results.concat(subDirData);
		} else if (item.type === 'file' && item.name.endsWith('.csv')) {
			results.push(item);
		}
	}

	return results;
}

let ListTranslations: listTranslation[] = [];

export async function retrieveAndUpload_Lists() {
	// First, get english for each of the items
	async function setup_listTranslations() {
		const path = `ARCH1.0.3/English/Lists`;
		const csvFiles = await fetchRepoDataRecursive(path);
		for (const csvFile of csvFiles) {
			const csvUrl = csvFile.download_url;
			const csvData = await parseCSV(csvUrl);
			const list = csvFile.path.split('/')[3].toLowerCase();
			const sublist = csvFile.name.replace('.csv', '').toLowerCase();

			for (let index in csvData) {
				if (index == '0') continue;
				ListTranslations.push({
					List: list,
					Sublist: sublist,
					English: csvData[index][0],
					Spanish: '',
					French: '',
					Portuguese: ''
				});
			}
		}
	}

	await setup_listTranslations();

	console.log(ListTranslations);

	// Then, add the translation of these items
	for (const language of languages) {
		const path = `ARCH1.0.3/${language}/Lists`;
		const csvFiles = await fetchRepoDataRecursive(path);

		for (const csvFile of csvFiles) {
			const csvUrl = csvFile.download_url;
			const csvData = await parseCSV(csvUrl);

			const list = csvFile.path.split('/')[3].toLowerCase();
			const sublist = csvFile.name.replace('.csv', '').toLowerCase();

			for (let index in csvData) {
				if (index == '0') continue;
				//console.log(list, sublist, csvData[index]);
				//addTranslationToLists(language.toLowerCase(), list, sublist, 'original', csvData[index]);
			}
			//await insertDataIntoSupabase(csvData, language.toLowerCase(), list, sublist);
		}
	}
}


