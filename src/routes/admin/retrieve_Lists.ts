import { insertListItems, getCurrentEntries_lists } from '$lib/supabase/supabaseHelpers';
import type {
	AnswerOption,
	ARCHEntry,
	Category,
	Language,
	Translation_Lists,
	TranslationLanguage
} from '$lib/types';
import Papa from 'papaparse';
const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

// Function to fetch and parse CSV data
async function fetchAndParseListCSV(
	owner: string,
	repo: string,
	path: string
): Promise<{ [sublist: string]: string[][] }> {
	console.log('fetchAndParseCSV at ' + path);

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
		csvData[sublist] = parsedData.slice(1);
	}

	return csvData;
}

async function fetchAndParseARCHCSV(
	owner: string,
	repo: string,
	path: string
): Promise<ARCHEntry[]> {
	console.log('fetchAndParseARCHCSV; ' + path);

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
                ... on Blob {
                  text
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
	const csvText = data.data.repository.object.text;
	const parsedData = Papa.parse(csvText, { header: true }).data as Record<string, string>[];

	const ARCHData: ARCHEntry[] = parsedData.map((row) => {
		const variable = row['Variable']?.trim() || '';
		const question = row['Question']?.trim() || '';
		const definition = row['Definition']?.trim() || '';
		const completionGuideline = row['Completion Guideline']?.trim() || '';
		const section = row['Section']?.trim() || '';
		const form = row['Form']?.trim() || '';
		const rawAnswerOptions = row['Answer Options']?.trim() || null;

		const answerOptions: AnswerOption[] | null = rawAnswerOptions
			? rawAnswerOptions.split('|').map((optionStr) => {
					const [codeStr, text] = optionStr.split(',').map((s) => s.trim());
					return {
						code: parseInt(codeStr),
						text: text
					};
				})
			: null;

		return {
			variable,
			question,
			definition,
			completionGuideline,
			section,
			form,
			answerOptions
		};
	});

	return ARCHData;
}

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

	if (category == 'Questions') {
		PullARCH(language, version, owner, repo);
	}
}

async function PullLists(language: Language, version: string, owner: string, repo: string) {
	async function verifyListTranslations(
		listTranslations: Translation_Lists[],
		translationLanguage: TranslationLanguage
	) {
		// if nothing to check, don't do anything
		if (listTranslations.length === 0) return [];

		// Pull all existing translations from Supabase
		const currentListsTable = await getCurrentEntries_lists(translationLanguage);

		// Get set of listTranslations not in currentListsTable

		// Function to compare objects based on key-value pairs
		function isObjectInList(object: Translation_Lists, list: Translation_Lists[]): boolean {
			return list.some((item) =>
				Object.keys(item).every(
					(key) => item[key as keyof Translation_Lists] === object[key as keyof Translation_Lists]
				)
			);
		}

		// Filter listOne to get objects not in listTwo
		const newTranslations = listTranslations.filter(
			(item) => !isObjectInList(item, currentListsTable)
		);

		console.log('newTranslations', newTranslations);

		return newTranslations;
	}

	console.log('Pull Lists; ' + language);
	const translationLanguage: TranslationLanguage = language.toLowerCase() as TranslationLanguage;
	const lists = [
		'conditions',
		'demographics',
		'drugs',
		'followup',
		'inclusion',
		'outcome',
		'pathogens'
	];

	//  1.  Start list of empty list-translation objects, directly what goes into Supabase
	//  2.  Then, pull english and the translation of each and build a list-translation object, and add it to the list
	//  3.  Pull all of supabases Lists
	//  4.  Finally, go through each list-translation, check if it is supabase.  If it is, don't push it, if it isn't, push it. (check if english and translation are in the database)

	const listTranslations: Translation_Lists[] = [];

	for (const list of lists) {
		const pathEnglish = `main:ARCH${version}/English/Lists/${list}`;
		const csvDataEnglish = await fetchAndParseListCSV(owner, repo, pathEnglish);

		const pathTranslation = `main:ARCH${version}/${language}/Lists/${list}`;
		const csvDataTranslation = await fetchAndParseListCSV(owner, repo, pathTranslation);

		for (const sublist in csvDataEnglish) {
			if (csvDataTranslation[sublist] == undefined) continue;
			for (const index in csvDataEnglish[sublist]) {
				if (csvDataTranslation[sublist][index] == undefined) continue;

				const original: string = csvDataEnglish[sublist][index][0];
				const translation: string = csvDataTranslation[sublist][index][0];

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
	const verifiedListTranslations: Translation_Lists[] = await verifyListTranslations(
		listTranslations,
		translationLanguage
	);

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

	console.log(' -- Complete!', language, version);
}

async function PullARCH(language: Language, version: string, owner: string, repo: string) {
	const pathEnglish = `main:ARCH${version}/English/ARCH.csv`;
	const csvEnglish = await fetchAndParseARCHCSV(owner, repo, pathEnglish);

	console.log(csvEnglish);
}
