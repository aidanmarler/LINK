export async function getArcVersions(): Promise<Record<string, string[]>> {
	const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
	const response = await fetch(`https://api.github.com/repos/ISARICResearch/ARC-Translations/contents`, {
		headers: {
			Authorization: `Bearer ${githubToken}`,
			Accept: 'application/vnd.github.v3+json'
		}
	});

	// Return error
	if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

	const topLevel = await response.json();
	const topFolders = topLevel.filter((item: { type: unknown }) => item.type === 'dir');
	const archFolders = topFolders.filter((item: any) => item.name.includes('ARCH'));

	// Get subfolders
	const folderData = await Promise.all(
		archFolders.map(async (folder: any) => {
			const subResponse = await fetch(
				`https://api.github.com/repos/ISARICResearch/ARC-Translations/contents/${folder.path}`,
				{
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: 'application/vnd.github.v3+json'
					}
				}
			);
			const subItems = await subResponse.json();
			const subFolders = subItems.filter((item: { type: unknown }) => item.type === 'dir');
			const arcVersion: string = folder.name as string;
			return { [arcVersion]: subFolders.map((f: any) => f.name) };
		})
	);

	// Format to key value pairs
	const filtered = Object.fromEntries(
		Object.entries(Object.assign({}, ...folderData))
			.filter(([_, subFolders]) => (subFolders as string[]).some((f) => f.includes('English')))
			.filter(([_, subFolders]) => (subFolders as string[]).length > 1)
	);

	const mutated = Object.fromEntries(
		Object.entries(filtered).map(([key, value]) => {
			const newKey = key.replace('ARCH', ''); // example key mutation
			const newValue = (value as string[]).filter((v) => v !== 'English'); // example value mutation
			return [newKey, newValue];
		})
	);
	return mutated;
}
