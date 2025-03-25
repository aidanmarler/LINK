<script lang="ts">
	import { onMount } from 'svelte';

	let repoData: any = null;
	let folderContents: any[] = [];
	let currentPath: string = '';
	let error: string | null = null;
	let isLoading: boolean = true;

	// Replace with your GitHub username and repository name
	const username = 'ISARICResearch';
	const repoName = 'ARC-Translations';

	// Fetch repository data on component mount
	onMount(async () => {
		await fetchRepoData();
	});

	// Function to fetch repository data
	async function fetchRepoData(path: string = '') {
		isLoading = true;
		error = null;
		try {
			const url = `https://api.github.com/repos/${username}/${repoName}/contents/${path}`;
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
			} else {
				folderContents = [data]; // If it's a file, wrap it in an array
			}
			currentPath = path;
		} catch (err: any) {
			error = err.message;
			console.error('Error fetching data:', err); // Debugging: Log the error
		} finally {
			isLoading = false;
		}
	}

	// Function to handle folder navigation
	function navigateToFolder(path: string) {
		fetchRepoData(path);
	}

	// Function to go back to the parent directory
	function goBack() {
		const parentPath = currentPath.split('/').slice(0, -1).join('/');
		fetchRepoData(parentPath);
	}
</script>

<main>
	{#if error}
		<p>Error: {error}</p>
	{:else if isLoading}
		<p>Loading...</p>
	{:else}
		<h1>{repoData?.full_name || 'GitHub Repository Explorer'}</h1>
		<h2>Contents of {currentPath || 'root'}</h2>
		{#if currentPath}
			<button on:click={() => goBack()}>Go Back</button>
		{/if}
		<ul>
			{#each folderContents as item}
				<li>
					{#if item.type === 'dir'}
						<strong on:click={() => navigateToFolder(item.path)}>{item.name}/</strong>
					{:else}
						<span>{item.name}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	main {
		font-family: Arial, sans-serif;
		padding: 20px;
	}
	strong {
		cursor: pointer;
		color: rgb(139, 139, 223);
		text-decoration: underline;
	}
	button {
		margin-bottom: 10px;
	}
</style>
