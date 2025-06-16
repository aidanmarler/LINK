import { insertListItems, getCurrentEntries_lists } from '$lib/supabase/supabaseHelpers';
import type { Category, Language, Translation_Lists, TranslationLanguage } from '$lib/types';
import Papa from 'papaparse';
const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

// Function to fetch and parse CSV data
async function fetchAndParseCSV(
	owner: string,
	repo: string,
	path: string
): Promise<{ [sublist: string]: string[][] }> {
	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${githubToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: `
          query GetCSVContents($owner: String!, $repo: String!, $path: String!) {
            repository(owner: $owner, name: $repo) {
              object(expression: $path) {
                ... on Tree {
                  entries {
                    name
                    object {
                      ... on Blob {
                        text
                      }
                    }
                  }
                }
              }
            }
          }
        `,
			variables: {
				owner,
				repo,
				path
			}
		})
	});

	const data = await response.json();
	const entries = data.data.repository.object.entries;

	const csvData: { [sublist: string]: string[][] } = {};
	for (const entry of entries) {
		const sublist = entry.name.replace('.csv', ''); // Remove .csv extension
		const csvText = entry.object.text;
		const parsedData = Papa.parse(csvText, { header: false }).data as string[][];
		csvData[sublist] = parsedData;
	}

	return csvData;
}

/*
// Function to organize data into listTranslation objects
export async function collectLists(owner: string, repo: string) {
	const languages = ['English', 'Spanish', 'French', 'Portuguese'];
	const lists = ['conditions', 'demographics', 'drugs', 'inclusion', 'outcome', 'pathogens'];
	let ListTranslations: listTranslation[] = [];

	// Step 1: Fetch all CSVs for each list and language
	const listData: { [list: string]: { [language: string]: { [sublist: string]: string[][] } } } =
		{};

	for (const list of lists) {
		listData[list] = {};

		for (const language of languages) {
			const path = `main:ARCH1.0.3/${language}/Lists/${list}`;
			const csvData = await fetchAndParseCSV(owner, repo, path);
			listData[list][language] = csvData;
		}
	}

	// Step 2: Build the ListTranslations array
	for (const list of lists) {
		const englishData = listData[list]['English'];

		for (const sublist in englishData) {
			const englishRows = englishData[sublist];

			for (let rowIndex = 1; rowIndex < englishRows.length; rowIndex++) {
				const englishRow = englishRows[rowIndex];

				const translationObject: listTranslation = {
					List: list,
					Sublist: sublist,
					English: englishRow[0], // First column is the English translation
					Spanish: '',
					French: '',
					Portuguese: ''
				};

				// Add translations from other languages
				for (const language of languages) {
					if (language === 'English') continue; // Skip English (already added)

					const languageData = listData[list][language];
					if (languageData[sublist] && languageData[sublist][rowIndex]) {
						const retypedLanguage: Language = language as Language;
						translationObject[retypedLanguage] = languageData[sublist][rowIndex][0]; // First column is the translation
					}
				}

				ListTranslations.push(translationObject);
			}
		}
	}

	return ListTranslations;
}

export async function fillSupabase() {
	const owner = 'ISARICResearch';
	const repo = 'ARC-Translations';

	collectLists(owner, repo).then((ListTranslations) => {
		console.log(ListTranslations); // Output: Next operation
		for (const translation of ListTranslations) {
			if (translation.English == '') continue;
			//insertDataIntoSupabase(csvData, language.toLowerCase(), list, sublist);
			for (const language of languages) {
				type languageTypes = 'Spanish' | 'French' | 'Portuguese';

				insertDataIntoSupabase(
					language.toLowerCase(),
					translation.List,
					translation.Sublist,
					translation.English,
					translation[language as languageTypes]
				);
			}
		}
	});
}
*/

// Function to update category repository for specified language
export async function PullCategory(
	category: Category,
	language: Language,
	version: string = '1.1.0'
) {
	const owner = 'ISARICResearch';
	const repo = 'ARC-Translations';

	if (category == 'Lists') {
		PullLists(language, version, owner, repo);
	}
}

async function PullLists(language: Language, version: string, owner: string, repo: string) {
	async function verifyListTranslations(listTranslations: Translation_Lists[]) {
		// if nothing to check, don't do anything
		if (listTranslations.length === 0) return [];

		// Pull all existing translations from Supabase
		const currentListsTable = await getCurrentEntries_lists();

		// Get set of listTranslations not in currentListsTable

		// Function to compare objects based on key-value pairs
		function isObjectInList(object: any, list: any[]): boolean {
			return list.some((item) => Object.keys(item).every((key) => item[key] === object[key]));
		}

		// Filter listOne to get objects not in listTwo
		const newTranslations = listTranslations.filter(
			(item) => !isObjectInList(item, currentListsTable)
		);

		console.log(listTranslations.length, currentListsTable.length, newTranslations.length);
		console.log('newTranslations', newTranslations);

		return newTranslations;
	}

	console.log('Pull Lists; ' + language);
	const lists = ['conditions', 'demographics', 'drugs', 'inclusion', 'outcome', 'pathogens'];

	//  1.  Start list of empty list-translation objects, directly what goes into Supabase
	//  2.  Then, pull english and the translation of each and build a list-translation object, and add it to the list
	//  3.  Pull all of supabases Lists
	//  4.  Finally, go through each list-translation, check if it is supabase.  If it is, don't push it, if it isn't, push it. (check if english and translation are in the database)

	const listTranslations: Translation_Lists[] = [];

	for (const list of lists) {
		const pathEnglish = `main:ARCH${version}/English/Lists/${list}`;
		const csvDataEnglish = await fetchAndParseCSV(owner, repo, pathEnglish);

		const pathTranslation = `main:ARCH${version}/${language}/Lists/${list}`;
		const csvDataTranslation = await fetchAndParseCSV(owner, repo, pathTranslation);

		for (const sublist in csvDataEnglish) {
			for (const index in csvDataEnglish[sublist]) {
				/*
				// Here I am getting and saving how many times it has been reviewed, but this doesn't really matter yet...
				const ClinicalLanguageSpeakerReviewed =
					csvDataTranslation[sublist][index].at(-1) == ''
						? '0'
						: Number(csvDataTranslation[sublist][index].at(-1));*/
				//const LanguageSpeakerReviewed = csvDataTranslation[sublist][index].at(-2) == '' ? "0" : Number(csvDataTranslation[sublist][index].at(-2))

				if (csvDataTranslation[sublist] == undefined) continue;
				if (csvDataTranslation[sublist][index] == undefined) continue;

				const original: string = csvDataEnglish[sublist][index][0];
				const translation: string = csvDataTranslation[sublist][index][0];
				const translationLanguage: TranslationLanguage =
					language.toLowerCase() as TranslationLanguage;

				//if (Number.isNaN(ClinicalLanguageSpeakerReviewed)) continue;
				if (original == '' || translation == '') continue;

				const listTranslation: Translation_Lists = {
					translationLanguage,
					list,
					sublist,
					original,
					translation
				};

				listTranslations.push(listTranslation);
			}
		}
	}

	// Check listTranslations
	const verifiedListTranslations: Translation_Lists[] =
		await verifyListTranslations(listTranslations);

	// Update supabase with new translations
	await insertListItems(
		verifiedListTranslations.map((item) => ({
			language: item.translationLanguage,
			list: item.list,
			sublist: item.sublist,
			original: item.original,
			translation: item.translation
		}))
	);

	console.log('complete!');
}
