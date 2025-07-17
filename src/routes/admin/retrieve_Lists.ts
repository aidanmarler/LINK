import {
	insertListItems,
	getCurrentEntries_lists,
	getExistingSimpleTranslations,
	insertTranslations,
	getExistingVariableTranslations
} from '$lib/supabase/supabaseHelpers';
import {
	type ARCHData,
	type Category,
	type Language,
	type ListTranslation,
	type SimpleTranslation,
	type Table,
	type TranslationLanguage,
	type VariableTranslation,
	type VariableTranslationTable
} from '$lib/types';
import { generateKey } from '$lib/utils';
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

async function fetchAndParseARCHCSV(owner: string, repo: string, path: string): Promise<ARCHData> {
	console.log('Fetching ARCH at ' + path);
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
	//console.log(csvText.length);

	const parseConfig: Papa.ParseConfig = {
		header: true,
		skipEmptyLines: true,
		delimiter: ',',
		quoteChar: '"',
		escapeChar: '"',
		dynamicTyping: false // Keep everything as strings
	};
	const papaParsed = Papa.parse(csvText, parseConfig);
	const parsedError = papaParsed.errors;
	if (parsedError.length > 0) console.log('   ARCH parse errors', parsedError);
	const parsedData = papaParsed.data as Record<string, string>[];
	//console.log(parsedData.length);
	const ARCHData: ARCHData = {};

	parsedData.forEach((row) => {
		const variable = row['Variable']?.trim() || '';
		const question = row['Question']?.trim() || '';
		const definition = row['Definition']?.trim() || '';
		const completionGuideline = row['Completion Guideline']?.trim() || '';
		const section = row['Section']?.trim() || '';
		const form = row['Form']?.trim() || '';
		const rawAnswerOptions = row['Answer Options']?.trim() || null;

		const answerOptions: Record<string, string> | null = rawAnswerOptions
			? Object.fromEntries(
					rawAnswerOptions.split('|').map((optionString) => {
						const [codeStr, text] = optionString.split(',').map((s) => s.trim());
						return [codeStr, text]; // returns a tuple [key, value]
					})
				)
			: null;

		ARCHData[variable] = {
			question,
			definition,
			completionGuide: completionGuideline,
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
		listTranslations: ListTranslation[],
		translationLanguage: TranslationLanguage
	) {
		// if nothing to check, don't do anything
		if (listTranslations.length === 0) return [];

		// Pull all existing translations from Supabase
		const currentListsTable = await getCurrentEntries_lists(translationLanguage);

		// Get set of listTranslations not in currentListsTable

		// Function to compare objects based on key-value pairs
		function isObjectInList(object: ListTranslation, list: ListTranslation[]): boolean {
			return list.some((item) =>
				Object.keys(item).every(
					(key) => item[key as keyof ListTranslation] === object[key as keyof ListTranslation]
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

	const listTranslations: ListTranslation[] = [];

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
				if (original == '' || translation == '') continue;

				const listTranslation: ListTranslation = {
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
	const verifiedListTranslations: ListTranslation[] = await verifyListTranslations(
		listTranslations,
		translationLanguage
	);

	// Update supabase with new translations
	await insertListItems(verifiedListTranslations);

	console.log(' -- Complete!', language, version);
}

async function PullARCH(ARCHlanguage: Language, version: string, owner: string, repo: string) {
	console.log('Pulling ARCH...');
	// 1. Get ARCH for language and version
	const pathEnglish = `main:ARCH${version}/English/ARCH.csv`;
	const pathTranslation = `main:ARCH${version}/${ARCHlanguage}/ARCH.csv`;
	const csvTranslation: ARCHData = await fetchAndParseARCHCSV(owner, repo, pathTranslation);
	const csvEnglish: ARCHData = await fetchAndParseARCHCSV(owner, repo, pathEnglish);

	const language: TranslationLanguage = ARCHlanguage.toLowerCase() as TranslationLanguage;

	// 2. Get Supabase existing Translations
	const existingTranslations: Record<
		Table,
		Map<string, SimpleTranslation | VariableTranslation>
	> = {
		forms: await getExistingSimpleTranslations('forms', language),
		sections: await getExistingSimpleTranslations('sections', language),
		answer_options: await getExistingSimpleTranslations('answer_options', language),
		questions: await getExistingVariableTranslations('questions', language),
		definitions: await getExistingVariableTranslations('definitions', language),
		completion_guides: await getExistingVariableTranslations('completion_guides', language)
	};

	// 3. Define new translation sets
	const newTranslations: Record<Table, Map<string, SimpleTranslation | VariableTranslation>> = {
		forms: new Map<string, SimpleTranslation>(),
		sections: new Map<string, SimpleTranslation>(),
		answer_options: new Map<string, SimpleTranslation>(),
		questions: new Map<string, VariableTranslation>(),
		definitions: new Map<string, VariableTranslation>(),
		completion_guides: new Map<string, VariableTranslation>()
	};

	// Helper function to add translation if not exists
	const addTranslationIfNew = (
		table: Table,
		key: string,
		translation: SimpleTranslation | VariableTranslation
	) => {
		if (!existingTranslations[table].has(key) && !newTranslations[table].has(key)) {
			(newTranslations[table] as Map<string, SimpleTranslation | VariableTranslation>).set(
				key,
				translation
			);
		}
	};

	// 4. Check if translation in existing translations
	for (const variable in csvEnglish) {
		if (variable == '') continue;
		if (!(variable in csvTranslation)) continue;

		const csvEng = csvEnglish[variable];
		const csvTrans = csvTranslation[variable];

		// Form
		addTranslationIfNew('forms', generateKey([language, csvEng.form, csvTrans.form]), {
			language: language,
			original: csvEng.form,
			translation: csvTrans.form
		});

		addTranslationIfNew('sections', generateKey([language, csvEng.section, csvTrans.section]), {
			language: language,
			original: csvEng.section,
			translation: csvTrans.section
		});

		addTranslationIfNew(
			'questions',
			generateKey([variable, language, csvEng.question, csvTrans.question]),
			{
				variable_id: variable,
				language: language,
				form: csvEng.form,
				section: csvEng.section,
				original: csvEng.question,
				translation: csvTrans.question
			}
		);

		addTranslationIfNew(
			'definitions',
			generateKey([variable, language, csvEng.definition, csvTrans.definition]),
			{
				variable_id: variable,
				language: language,
				form: csvEng.form,
				section: csvEng.section,
				original: csvEng.definition,
				translation: csvTrans.definition
			}
		);

		addTranslationIfNew(
			'completion_guides',
			generateKey([variable, language, csvEng.completionGuide, csvTrans.completionGuide]),
			{
				variable_id: variable,
				language: language,
				form: csvEng.form,
				section: csvEng.section,
				original: csvEng.completionGuide,
				translation: csvTrans.completionGuide
			}
		);

		// Answer options
		if (csvEng.answerOptions !== null) {
			for (const answer in csvEng.answerOptions) {
				if (!csvTrans.answerOptions) continue;
				if (!csvTrans.answerOptions[answer]) continue;
				addTranslationIfNew(
					'answer_options',
					generateKey([language, csvEng.answerOptions[answer], csvTrans.answerOptions[answer]]),
					{
						language: language,
						original: csvEng.answerOptions[answer],
						translation: csvTrans.answerOptions[answer]
					}
				);
			}
		}
	}

	console.log(newTranslations.definitions, newTranslations.completion_guides);

	await Promise.all([
		insertTranslations('forms', newTranslations.forms),
		insertTranslations('sections', newTranslations.sections),
		insertTranslations('answer_options', newTranslations.answer_options),
		insertTranslations(
			'questions' as VariableTranslationTable,
			newTranslations.questions as Map<string, VariableTranslation>
		),
		insertTranslations(
			'definitions' as VariableTranslationTable,
			newTranslations.definitions as Map<string, VariableTranslation>
		),
		insertTranslations(
			'completion_guides' as VariableTranslationTable,
			newTranslations.completion_guides as Map<string, VariableTranslation>
		)
	]);
	return;
}
