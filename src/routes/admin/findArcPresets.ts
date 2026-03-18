import Papa from 'papaparse';
const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

export async function GetArcPresets(
	version: string
): Promise<
	[Record<string, string[]>, { [list: string]: { [sublist: string]: Record<string, string[]> } }]
> {
	//  &  Use ARC main data to get variable presets
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

	//  &  Use ARC main data to get variable presets
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

	//  &  Get Folder names of a given repo - used to get all lists
	async function fetchFolderNames(
		version: string,
		owner: string = 'ISARICResearch',
		repo: string = 'ARC',
		path: string = 'Lists'
	) {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=v${version}`,
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
		console.log('contents', contents, typeof contents);
		// @ what is the real type?
		const folderNames = contents
			.filter((item: any) => item.type === 'dir')
			.map((item: any) => item.name);

		return folderNames;
	}

	// Function to pull tag from ARC
	async function fetchAndParseArcMain(
		version: string,
		owner = 'ISARICResearch',
		repo = 'ARC',
		path = 'ARC.csv'
	) {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=v${version}`,
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
		version: string,
		path: string,
		owner = 'ISARICResearch',
		repo = 'ARC'
	): Promise<{ [sublist: string]: Record<string, string>[] }> {
		const listResponse = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=v${version}`,
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
					`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=v${version}`,
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

	// == (1) == Get Documents in ARC from presets

	const listFolder = await fetchFolderNames(version);

	const arcMain = await fetchAndParseArcMain(version);

	const arcPresetMap = await mapArcPresets(arcMain);

	const listsMain: { [list: string]: { [sublist: string]: Record<string, string>[] } } = {};
	const listsPresetMap: { [list: string]: { [sublist: string]: Record<string, string[]> } } = {};
	await Promise.all(
		listFolder.map(async (list: string) => {
			listsMain[list] = await fetchAndParseListsMain(version, 'Lists/' + list);
			//updateStatus('retrieved lists main, ' + list);
			for (const sublist in listsMain[list]) {
				if (!listsMain[list][sublist]) continue;
				if (!listsPresetMap[list]) listsPresetMap[list] = {};
				if (!listsPresetMap[list][sublist]) listsPresetMap[list][sublist] = {};
				listsPresetMap[list][sublist] = await mapListsPresets(listsMain[list][sublist]);
			}
		})
	);

	return [arcPresetMap, listsPresetMap];
}
