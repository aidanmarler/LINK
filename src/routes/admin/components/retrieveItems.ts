import { languages } from '$lib/dependencies';
import { insertDataIntoSupabase } from '$lib/supabaseHelpers';
import type { listTranslation } from '$lib/types';
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
						type languageTypes = 'English' | 'Spanish' | 'French' | 'Portuguese';
						const retypedLanguage: languageTypes = language as languageTypes;
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
	// Example usage
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
