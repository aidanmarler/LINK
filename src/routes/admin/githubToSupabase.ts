import type { ARCHData, GithubLanguage, TranslationLanguage } from '$lib/types';
import Papa from 'papaparse';
import {
	MapArchToOriginalSegmentInsert,
	MapListToOriginalSegmentInsert,
	pullOriginalSegments,
	UpdateOriginalSegments
} from '$lib/supabase/originalTranslations';
import type { OriginalSegmentRow, TranslationVerificationMap } from '$lib/supabase/types';
import {
	MapArchToForwardTranslationInsert,
	MapListToForwardTranslationInsert,
	pullForwardTranslationsForAcceptedVerification as pullForwardTranslationsForVerification,
	pullMachineForwardTranslations,
	UpdateForwardTranslations
} from '$lib/supabase/forwardTranslations';
import {
	CheckAcceptedTranslations,
	pullAcceptedTranslationsForAcceptedVerification as pullAcceptedTranslationsForVerification
} from '$lib/supabase/acceptedTranslations';
import { pullTranslationProgressForVerification } from '$lib/supabase/translationProgress';
const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

/*

This script is for our 

*/

async function fetchAndParseArchCSV(
	owner: string,
	repo: string,
	branch: string,
	path: string
): Promise<ARCHData> {
	console.log('Fetching ARCH at ' + path);

	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
		{
			headers: {
				Authorization: `Bearer ${githubToken}`,
				Accept: 'application/vnd.github.v3.raw'
			}
		}
	);

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	const csvText = await response.text();

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
	if (parsedError.length > 0) console.log('     ARCH parse errors', parsedError);
	const parsedData = papaParsed.data as Record<string, string>[];
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

// Function to fetch and parse CSV data
async function fetchAndParseListCSV(
	owner: string,
	repo: string,
	branch: string,
	path: string
): Promise<{ [sublist: string]: string[][] }> {
	console.log('fetchAndParseCSV at ' + path);

	const listResponse = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
		{
			headers: {
				Authorization: `Bearer ${githubToken}`,
				Accept: 'application/vnd.github.v3+json'
			}
		}
	);

	if (!listResponse.ok) {
		throw new Error(`GitHub API error: ${listResponse.status}`);
	}

	const files = await listResponse.json();
	const csvData: { [sublist: string]: string[][] } = {};

	// Fetch each CSV file
	for (const file of files) {
		if (file.type === 'file' && file.name.endsWith('.csv')) {
			const fileResponse = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
				{
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: 'application/vnd.github.v3.raw'
					}
				}
			);

			if (!fileResponse.ok) {
				console.error(`Failed to fetch ${file.name}`);
				continue;
			}

			const csvText = await fileResponse.text();
			const sublist = file.name.replace('.csv', '');
			const parsedData = Papa.parse(csvText, { header: false }).data as string[][];
			csvData[sublist] = parsedData.slice(1);
		}
	}

	return csvData;
}

// Function to pull tag from ARC
async function fetchAndParseArcMain(owner: string, repo: string, branch: string, path: string) {
	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
		{
			headers: {
				Authorization: `Bearer ${githubToken}`,
				Accept: 'application/vnd.github.v3.raw'
			}
		}
	);

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	const csvText = await response.text();

	const parseConfig: Papa.ParseConfig = {
		header: true,
		skipEmptyLines: true,
		delimiter: ',',
		quoteChar: '"',
		dynamicTyping: false // Keep everything as strings
	};
	const papaParsed = Papa.parse(csvText, parseConfig);
	const parsedError = papaParsed.errors;
	if (parsedError.length > 0) console.log('     ARCH parse errors', parsedError);
	const parsedData = papaParsed.data as Record<string, string>[];
	return parsedData;
}

async function fetchAndParseListsMain(
	owner: string,
	repo: string,
	branch: string,
	path: string
): Promise<{ [sublist: string]: Record<string, string>[] }> {
	const listResponse = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
		{
			headers: {
				Authorization: `Bearer ${githubToken}`,
				Accept: 'application/vnd.github.v3+json'
			}
		}
	);

	if (!listResponse.ok) {
		throw new Error(`GitHub API error: ${listResponse.status}`);
	}

	const files = await listResponse.json();
	const csvData: { [sublist: string]: Record<string, string>[] } = {};

	for (const file of files) {
		if (file.type === 'file' && file.name.endsWith('.csv')) {
			const fileResponse = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
				{
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: 'application/vnd.github.v3.raw'
					}
				}
			);

			if (!fileResponse.ok) {
				console.error(`Failed to fetch ${file.name}`);
				continue;
			}

			const csvText = await fileResponse.text();
			const sublist = file.name.replace('.csv', '');
			const parseConfig: Papa.ParseConfig = {
				header: true,
				skipEmptyLines: true,
				delimiter: ',',
				quoteChar: '"',
				dynamicTyping: false // Keep everything as strings
			};
			const papaParsed = Papa.parse(csvText, parseConfig);
			const parsedError = papaParsed.errors;
			if (parsedError.length > 0) console.log('     ARCH parse errors', parsedError);
			const parsedData = papaParsed.data as Record<string, string>[];

			// Get the first column name
			const firstColumnName = Object.keys(parsedData[0] || {})[0];

			// Rename the first column to "Variable" in each row
			const renamedData = parsedData.map((row) => {
				const newRow: Record<string, string> = { ...row };
				if (firstColumnName && firstColumnName !== 'Variable') {
					newRow['Variable'] = row[firstColumnName];
					delete newRow[firstColumnName];
				}
				return newRow;
			});

			csvData[sublist] = renamedData;
		}
	}

	return csvData;
}

/* 

--- Update LINK's supabase tables from ARC ---

Start by getting current version, then lists, then presets for each variable

Next, get all data from 

*/

export async function UpdateFromARC() {
	// Use ARC main data to get variable presets
	async function mapArcPresets(arcMain: Record<string, string>[]) {
		const presetMap: Record<string, string[]> = {};

		for (const item of arcMain) {
			const variable = item.Variable;
			if (!variable) continue; // skip when no variable

			presetMap[variable] = [];

			// Check all columns that start with "preset_"
			for (const [columnName, value] of Object.entries(item)) {
				if (columnName.startsWith('preset_') && value === '1') {
					// Extract the text after "preset_"
					const presetName = columnName.substring(7); // "preset_".length = 7
					presetMap[variable].push(presetName);
				}
			}
		}
		return presetMap;
	}

	// Use ARC main data to get variable presets
	async function mapListsPresets(arcMain: Record<string, string>[]) {
		const presetMap: Record<string, string[]> = {};

		for (const item of arcMain) {
			if (!item) continue; // skip when no row
			const listItem = item.Variable;
			if (!listItem) continue; // skip when no variable

			presetMap[listItem] = [];

			// Check all columns that start with "preset_"
			for (const [columnName, value] of Object.entries(item)) {
				if (columnName.startsWith('preset_') && value === '1') {
					// Extract the text after "preset_"
					const presetName = columnName.substring(7); // "preset_".length = 7
					presetMap[listItem].push(presetName);
				}
			}
		}
		return presetMap;
	}

	// Get ARC repository version number from Tag
	async function getArcLatestVersion(owner: string, repo: string) {
		const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
			headers: {
				Authorization: `Bearer ${githubToken}`,
				Accept: 'application/vnd.github.v3+json'
			}
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const data = await response.json();
		const tag: string = data.tag_name;
		return tag.replace('v', '');
	}

	// Get Folder names of a given repo - used to get all lists
	async function fetchFolderNames(owner: string, repo: string, branch: string, path: string) {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
			{
				headers: {
					Authorization: `Bearer ${githubToken}`,
					Accept: 'application/vnd.github.v3+json' // Changed from .raw
				}
			}
		);

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const contents = await response.json();

		// Filter for directories only and extract names
		const folderNames = contents
			.filter((item: any) => item.type === 'dir')
			.map((item: any) => item.name);

		return folderNames;
	}

	// Get Arch-Translations english, return table rows and data for later
	async function fetchArchEnglish(
		version: string,
		owner: string,
		repo: string,
		branch: string,
		lists: string[],
		arcPresetMap: Record<string, string[]>,
		listsPresetMap: { [list: string]: { [sublist: string]: Record<string, string[]> } }
	) {
		/* Step 1: Pull English Data from ARCH, transform it to Original Segment */

		// 1A. Get Lists for english and version
		const listsOriginalSegments = [];
		const listsEnglishData: { [listName: string]: { [sublist: string]: string[][] } } = {};

		for (const list of lists) {
			console.log(`1A -> Pulling list ${list}, English, ${version}...`);
			const listEnglishPath = `ARCH${version}/English/Lists/${list}`;
			const listEnglish: { [sublist: string]: string[][] } = await fetchAndParseListCSV(
				owner,
				repo,
				branch,
				listEnglishPath
			);
			listsEnglishData[list] = listEnglish;
			const listPresetMap = listsPresetMap[list];
			const listOriginalSegments = await MapListToOriginalSegmentInsert(
				version,
				list,
				listEnglish,
				listPresetMap
			);
			listsOriginalSegments.push(...listOriginalSegments);
		}

		// 1B. Get ARCH for language and version
		console.log(`1B -> Pulling ARCH, English, ${version}...`);
		const pathEnglish = `ARCH${version}/English/ARCH.csv`;
		const archEnglish: ARCHData = await fetchAndParseArchCSV(owner, repo, branch, pathEnglish);
		const archOriginalSegments = await MapArchToOriginalSegmentInsert(
			version,
			archEnglish,
			arcPresetMap
		);
		const allOriginalSegments = [...listsOriginalSegments, ...archOriginalSegments];

		return { allOriginalSegments, archEnglish, listsEnglishData };
	}

	async function fetchAndUpdateArchTranslations(
		version: string,
		owner: string,
		repo: string,
		branch: string,
		lists: string[],
		languages: GithubLanguage[],
		listsEnglishData: { [listName: string]: { [sublist: string]: string[][] } },
		archEnglish: ARCHData
	) {
		/* Step 2: Forward Translations */

		// 2A. Get all original segments with their IDs
		const originalArchSegments: OriginalSegmentRow[] = await pullOriginalSegments(false); // all non list items
		const originalListSegments: OriginalSegmentRow[] = await pullOriginalSegments(true); // all list items

		// 2B. Create lookup map: composite key -> original_id & row

		const archOriginalIdMap: Record<string, { id: number; row: OriginalSegmentRow }> = {};
		for (const seg of originalArchSegments) {
			const key = `${seg.segment.trim()}|${seg.type.trim()}|${seg.location ?? ''}|${seg.answer_options ?? ''}`;
			archOriginalIdMap[key] = { id: seg.id, row: seg };
		}
		const listOriginalIdMap: Record<string, { id: number; row: OriginalSegmentRow }> = {};
		for (const seg of originalListSegments) {
			const key = `${seg.segment}|${seg.location ?? ''}`;
			listOriginalIdMap[key] = { id: seg.id, row: seg };
		}

		// 2C. For each active language, pull the target csvs, map to ForwardTranslationInsert, and add any new ones
		for (const language of languages) {
			// i. Pull existing translations for language
			const existingTranslations = await pullMachineForwardTranslations(
				language.toLowerCase() as TranslationLanguage
			);

			// ii. Pull the arch and list csvs for the target language
			const pathArch = `ARCH${version}/${language}/ARCH.csv`;
			const archTarget: ARCHData = await fetchAndParseArchCSV(owner, repo, 'main', pathArch);

			// iii. Map to ForwardTranslationInsert with original_ids
			const archForwardTranslations = await MapArchToForwardTranslationInsert(
				language.toLowerCase() as TranslationLanguage,
				archEnglish,
				archTarget,
				archOriginalIdMap // Pass the lookup map
			);

			// iv. For each list, pull the target csv and map to ForwardTranslationInsert
			const listsForwardTranslations = [];
			for (const list of lists) {
				const listTargetPath = `ARCH${version}/${language}/Lists/${list}`;
				const listTarget: { [sublist: string]: string[][] } = await fetchAndParseListCSV(
					owner,
					repo,
					branch,
					listTargetPath
				);

				// Map to ForwardTranslationInsert with english list data, target language list data, and originalListSegments to get original_id
				const listForwardTranslations = await MapListToForwardTranslationInsert(
					list,
					listTarget,
					listsEnglishData[list],
					listOriginalIdMap,
					language.toLowerCase() as TranslationLanguage
				);
				listsForwardTranslations.push(...listForwardTranslations);
			}

			console.log('Arch Translations to add for', language, archForwardTranslations);
			console.log('List Translations to add for', language, listsForwardTranslations);

			// 2d. Insert only new translations

			const allForwardTranslations = [...listsForwardTranslations, ...archForwardTranslations];

			await UpdateForwardTranslations(
				language.toLowerCase() as TranslationLanguage,
				allForwardTranslations,
				existingTranslations
			);
		}
	}

	async function updateTranslationStatusAndProgress(languages: GithubLanguage[]) {
		/* Step 3: Update Accepted Translations */

		/*
		
			For each language
			3a: Get all forward translations and accepted translations, map them as OriginalId: {forwardTranslations: [], acceptedTranslations: []}

			For each OriginalId
			!acceptedTranslation && forwardTranslation -> findBestforwardTranslation, add it to acceptedTranslations
			1 acceptedTranslation && 1 forwardTranslation &&  acceptedTranslation.id == forwardTranslation.id -> skip
			1 acceptedTranslation && 1 forwardTranslation &&  acceptedTranslation.id != forwardTranslation.id -> update acceptedTranslation.currently accepted = false, add forwardTranslation with currently_accepted = true
			acceptedTranslation && >1 forwardTranslation -> findBestforwardTranslation, update acceptedTranslations



			Key ideas:
			acceptedTranslations holds all translations that have ever been accepted as the best with the following columns:
				type AcceptedTranslationInsert = {
					id: number; (auto-generated server-side)
					created_at: string; (auto-generated server-side)
					currently_accepted: boolean;
					language: "spanish" | "french" | "portuguese";
					original_id: number;
					translation_id: number;
					translation_step: "forward" | "review" | "backward" | "adjudication" | "admin";
				}

			It stores then which original segment is accepted as being equal to which forward translation for a given language, and the step that translation comes from.
			For all of these imports, they come from forward translation, however down the line when we have the translationReviews table filled out, users will be able to review forward translations, choose the best, and then that will be added to accepeted translations.
			The accepted translation could change over and over as forward translations are entered, and keep the record of this by having the 'created_at'.
			So, if there is an accepted translation, and then it changes to a new one, rather than changing the accepted translation's translation_id, simply set currently accepted to false and then add a new row for the new accepted translation.
			Also, one cannot "go back" - once an accepted translation row's currently_accepted is set to 'false', we must keep it that way. That same translation_id can be found as the best translation for the original_id like before, but we must add a new row to accepted_translations in order to document all changes to accepted_translations.

		*/

		for (const language of languages) {
			const translationLanguage = language.toLowerCase() as TranslationLanguage;
			const forwardTranslations = await pullForwardTranslationsForVerification(translationLanguage); // get all with currently_accepted == true for lang (max 1 row per original_id)
			const translationProgress = await pullTranslationProgressForVerification(translationLanguage); // get all translation progress for lang (max 1 row per original_id)
			const acceptedTranslations =
				await pullAcceptedTranslationsForVerification(translationLanguage); // get all forward translation for lang

			// Create map of original_id: {translationProgress: {}, acceptedTranslation {}, forwardTranslations: {}[] }
			const translationVerificationMap: TranslationVerificationMap = {};

			// Initialize map with all original_ids from forward translations
			for (const ft of forwardTranslations) {
				if (!translationVerificationMap[ft.original_id]) {
					translationVerificationMap[ft.original_id] = {
						translationProgress: null,
						acceptedTranslation: null,
						forwardTranslations: []
					};
				}
				translationVerificationMap[ft.original_id].forwardTranslations.push(ft);
			}

			// Add translation progress
			for (const tp of translationProgress) {
				if (translationVerificationMap[tp.original_id]) {
					translationVerificationMap[tp.original_id].translationProgress = tp;
				}
			}
			// Add accepted translations (should be max 1 per original_id where currently_accepted = true)
			for (const at of acceptedTranslations) {
				if (translationVerificationMap[at.original_id]) {
					translationVerificationMap[at.original_id].acceptedTranslation = at;
				}
			}

			await CheckAcceptedTranslations(translationLanguage, translationVerificationMap);
		}

		return;
	}

	// Set up status
	let status = '';
	const updateStatus = (newStatus: string) => {
		status = newStatus;
		console.log(status);
	};

	// Begin

	updateStatus('retrieve arc version');
	const repos = { main: 'ARC', translations: 'ARC-Translations' };
	const languages: GithubLanguage[] = ['French', 'Portuguese', 'Spanish'];
	const owner = 'ISARICResearch';
	const version = await getArcLatestVersion(owner, repos.main);

	updateStatus('retrieve lists');
	const lists = await fetchFolderNames(owner, repos.main, 'main', 'Lists');

	updateStatus('retrieve arc main');
	const arcMain = await fetchAndParseArcMain(owner, repos.main, 'main', `ARC.csv`);

	updateStatus('map presets arc');
	const arcPresetMap = await mapArcPresets(arcMain);

	const listsMain: { [list: string]: { [sublist: string]: Record<string, string>[] } } = {};
	const listsPresetMap: { [list: string]: { [sublist: string]: Record<string, string[]> } } = {};
	for (const list of lists) {
		updateStatus('retrieve lists main, ' + list);
		listsMain[list] = await fetchAndParseListsMain(owner, repos.main, 'main', 'Lists/' + list);

		updateStatus('map presets lists, ' + list);
		for (const sublist in listsMain[list]) {
			if (!listsMain[list][sublist]) continue;
			if (!listsPresetMap[list]) listsPresetMap[list] = {};
			if (!listsPresetMap[list][sublist]) listsPresetMap[list][sublist] = {};
			listsPresetMap[list][sublist] = await mapListsPresets(listsMain[list][sublist]);
		}
	}

	updateStatus('fetch Arch English');
	const { allOriginalSegments, archEnglish, listsEnglishData } = await fetchArchEnglish(
		version,
		owner,
		repos.translations,
		'main',
		lists,
		arcPresetMap,
		listsPresetMap
	);

	updateStatus('Update Original Segments');
	await UpdateOriginalSegments(version, allOriginalSegments);

	updateStatus('fetchAndUpdateArchTranslations');
	await fetchAndUpdateArchTranslations(
		version,
		owner,
		repos.translations,
		'main',
		lists,
		languages,
		listsEnglishData,
		archEnglish
	);

	await updateTranslationStatusAndProgress(languages);

	console.log(version);
}
