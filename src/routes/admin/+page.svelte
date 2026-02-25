<script lang="ts">
	import { button } from '$lib/styles';
	import { fade, fly, scale } from 'svelte/transition';
	import { getArcVersions } from './getArcVersions';
	import { UpdateFromARC } from './githubToSupabase';
	import type { GithubLanguage } from '$lib/types';

	let arcVersions: Promise<Record<string, string[]>> = $state(getArcVersions());
	let selectedVersion = $derived(Object.keys(arcVersions)[0]);
</script>

{#await arcVersions}
	<p>Retrieving versions of arc...</p>
{:then versions}
	<div in:fly={{ y: 50, duration: 100, opacity: 0 }}>
		<label>
			ARCH
			<select
				class={button.stanley + ' px-2 border-2 cursor-pointer rounded-md'}
				bind:value={selectedVersion}
			>
				{#each Object.keys(versions).reverse() as version}
					<option value={version}>{version}</option>
				{/each}
			</select></label
		>
		<div class="border mt-2 rounded-lg border-stone-400 dark:border-stone-700">
			<div class="sm:flex p-1.5 border-b border-inherit">
				<button
					title="Pull Lists from GitHub"
					class=" w-1/3 mt-1 min-w-60 h-8 border-3 hover:shadow mr-2 font-semibold rounded-lg cursor-pointer
			border-blue-600 hover:border-blue-500 hover:bg-blue-500/20
						"
					onclick={async () => {
						if (selectedVersion)
							await UpdateFromARC(selectedVersion, versions[selectedVersion] as GithubLanguage[]);
						else console.error('no selected ARCH version');
					}}
				>
					Update LINK from ARC
				</button>
				<ol>
					<li>
						1. Connect to <em>ARC-Translations</em> GitHub Repo.
					</li>
					<li>2. Get most recent ARC version.</li>
					<li>
						3. Pull English version of <em>ARC.csv</em> and <em>Lists folder</em>.
					</li>
					<li>4. Add all new questions, answers, defintions, etc.</li>
					<li>5. Pull each other language.</li>
					<li>6. Add translations for new segemnts.</li>
				</ol>
			</div>

			<div class="sm:flex p-1.5">
				<button
					title="Pull Lists from GitHub"
					class="w-1/3 mt-1 min-w-60 h-8 border-3 hover:shadow mr-2 font-semibold rounded-lg cursor-pointer
						border-green-700 hover:border-green-600 hover:bg-green-600/20
					"
					onclick={async () => {
						console.log('export');
					}}
				>
					Export LINK
				</button>
				<ol>
					<li>Exports LINK as a folder of CSVs</li>
				</ol>
			</div>
		</div>
	</div>
{/await}
