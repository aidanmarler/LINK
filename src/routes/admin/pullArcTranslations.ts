import Papa from 'papaparse';

// <T>

export type CsvData = Record<string, unknown[]>;
//export type ArcVariableTranslationReview = 

export type ArcStructure = Record<
	string, // version
	Record<
		string, // language
		{
			Lists?: Record<string, string | CsvData>; // Folder level deep can vary
			'ARCH.csv'?: Record<
				string,
				{
					Variable: string;
					Form: string;
					Section: string;
					Question: string;
					'Answer Options': string;
					Definition: string;
					'Completion Guideline': string;
					'Question Translation Reviewers'?: string;
					'Definition Translation Reviewers'?: string;
					'Completion Guideline Translation Reviewers'?: string;
					'Form Translation Reviewers'?: string;
					'Section Translation Reviewers'?: string;
					'Answer Translation Reviewers'?: string;
				}
			>; // variable as record id
			'paper_like_details.csv'?: unknown[]; // just csv rows
			'supplemental_phrases.csv'?: unknown[]; // just csv rows
		}
	>
>;

export async function pullArcTranslations(version: string) {
	// <T> Basic tree data type so that my requests know what to expect and basic csv with name datatype
	type GitTree = {
		path: string;
		mode: string;
		type: string;
		sha: string;
		url: string;
		size: number;
	};

	// & get list of arch files to download from most recent branch of ARCH for our version
	async function findFiles(
		version: string,
		auth: { headers: { Authorization: string } },
		owner: string = 'ISARICResearch',
		repo: string = 'ARC-Translations',
		branch: string = 'main'
	): Promise<GitTree[]> {
		// + set arch version we are looking for
		const archVersion = `ARCH${version}`;

		// = ( 1 ) = use branch query to get tree URL
		const branchResponse = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
			auth
		);
		// ! if branch fetch error, throw error
		if (!branchResponse.ok) throw new Error(`Branch fetch error: ${branchResponse.status}`);
		// * reread branch as an object
		const branchData = await branchResponse.json();
		// + store url
		const treeUrl = branchData.commit.commit.tree.url;

		// = ( 2 ) = get branch tree to find version folder
		const treeResponse = await fetch(treeUrl, auth);
		// ! if tree fetch error, throw error
		if (!treeResponse.ok) throw new Error(`Tree fetch error: ${treeResponse.status}`);
		// * reread as an object
		const treeData = await treeResponse.json();
		// * find archVersion in treeData and store it's url
		let archUrl = '';
		for (const version of treeData.tree as GitTree[]) {
			if (version.path != archVersion) continue; // if arch version isn't the path label, skip
			archUrl = version.url; // otherwise, we have found our url and we can exit the loop!
			break;
		}
		// ! if tree fetch error, throw error
		if (archUrl == '') throw new Error(`Couldn't find ${archVersion} in ${treeData.tree}`);

		// = ( 3 ) = get arch folder recursively to get all contents
		const archResponse = await fetch(archUrl + '?recursive=1', auth);
		// ! if arch fetch error, throw error
		if (!archResponse.ok) throw new Error(`Arch fetch error: ${archResponse.status}`);
		// * reread as an object
		const archData = await archResponse.json();
		// * filter only files that are a blob (downloadable text)
		const files = archData.tree.filter((item: { type: string }) => item.type === 'blob');

		// == return files == //
		return files;
	}

	// & fetch all csvs and structure them
	async function fetchFiles(files: GitTree[]) {
		// == Pull all CSVs and decode them from base-64 to utf-8
		const contentArray = await Promise.all(
			files.map(async (file) => {
				// * fetch blob from github
				const response = await fetch(file.url, githubAuth);
				// ! if fetch error, throw error
				if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
				// * content as json
				const content = await response.json();
				// * get content.content from base64 to utf-8 OR latin-1 OR something fishy...
				const base64 = content.content.replace(/\s/g, ''); // strip GitHub's newlines
				const binary = atob(base64); // get bianary
				const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0)); // decode
				const csv = new TextDecoder('utf-8').decode(bytes); // csv text in UTF-8

				// == return content at path == //
				return { path: file.path, csv };
			})
		);

		// * Map the content to a record
		const content: Record<string, string> = Object.fromEntries(
			contentArray.map((e) => [e.path, e.csv])
		);

		// == Return mapped CSVs ==//
		return content;
	}

	// & parse content using Papa Parse
	async function parseCSVs(content: Record<string, string>) {
		// + set parse config
		const parseConfig: Papa.ParseConfig = { header: true, skipEmptyLines: true };
		// + initalized parsed content
		const parsedContent: CsvData = {};
		// == for each csv, parse it and map it to its location
		for (const path in content) {
			// * parse using header and skipping empty lines
			const parsedCsv = Papa.parse(content[path], parseConfig);
			// ! catch any parse errors
			if (parsedCsv.errors.length > 0)
				throw new Error(`Error parsing ${path}: ${parsedCsv.errors}`);
			// = map it to content
			parsedContent[path] = parsedCsv.data;
		}
		return parsedContent;
	}

	// & map content to json structure of folders
	async function mapCSVs(version: string, parsedContent: CsvData): Promise<ArcStructure> {
		// + get version and add "ARCH"
		const archVersion = 'ARCH' + version;
		// + init mapped content as archVersion: language: csvData
		const mappedContent: ArcStructure = { [archVersion]: {} };

		// == for each csv, parse it and map it to its location
		for (const pathText in parsedContent) {
			// + remove .csv
			//const pathClean = pathText.replace('.csv', '');
			// + make path a list of values
			const pathList = pathText.split('/');
			// + set current location
			let current = mappedContent[archVersion] as Record<string, unknown>;
			// * Traverse/create nested objects for all but the last key
			for (let i = 0; i < pathList.length - 1; i++) {
				if (!current[pathList[i]]) current[pathList[i]] = {};
				current = current[pathList[i]] as Record<string, unknown>;
			}

			// + get file name and data
			const fileName = pathList[pathList.length - 1];
			const fileData = parsedContent[pathText];

			//== Set the csv data at the last key
			if (fileName == 'ARCH.csv') {
				const arcCsv: Record<string, unknown> = {};
				for (const row of fileData as Record<string, unknown>[]) {
					const variable = row['Variable'] as string;
					arcCsv[variable] = row;
					current[fileName] = arcCsv;
				}
			} else {
				current[fileName] = fileData;
			}
			//current[pathList[pathList.length - 1]] = parsedContent[pathText];
		}

		return mappedContent;
	}

	// + set github authentication and arch version we are looking for
	const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
	const githubAuth = { headers: { Authorization: `Bearer ${githubToken}` } };

	// = ( 1 ) = Get list of files to download
	console.log('Find Files');
	const archFiles = await findFiles(version, githubAuth);
	//console.log('archFiles', archFiles);

	// = ( 2 ) = Download all files
	console.log('Fetch Files');
	const archContent = await fetchFiles(archFiles);
	//console.log('archContent', archContent);

	// = ( 3 ) = Parse files
	console.log('Parse Files');
	const parsedContent = await parseCSVs(archContent);
	//console.log('parsedContent', parsedContent);

	// = ( 4 ) = Map to JSON structure
	console.log('Map Files');
	const mappedContent = await mapCSVs(version, parsedContent);
	//console.log('mappedContent', mappedContent);

	// == Return structured content == //
	return mappedContent;
}
