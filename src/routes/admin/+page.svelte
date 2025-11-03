<script lang="ts">
	import { card_static } from '$lib/styles';
	import { UpdateFromARC } from './githubToSupabase';

	let ARCHVersion = $state('1.1.2');
</script>

<div class="max-w-96 flex-wrap space-x-2 flex p-2 rounded-lg {card_static}">
	<button
		title="Pull Lists from GitHub"
		class="dark:bg-blue-900 border-2 border-blue-600 px-3 font-semibold rounded-lg cursor-pointer
						hover:bg-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400"
		onclick={async () => {
			await UpdateFromARC();
		}}
	>
		Update LINK from ARC
	</button>

	<!--
	<input
		class=" border-2 px-3 w-20 font-semibold rounded-lg
						"
		bind:value={ARCHVersion}
	/>-->
</div>
