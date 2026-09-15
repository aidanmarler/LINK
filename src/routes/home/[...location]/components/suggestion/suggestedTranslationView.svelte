<script lang="ts">
	import type { TranslationStep } from '$lib/supabase/types';
	type suggestedTranslation = {
		translation: string;
		match: number;
		step: TranslationStep;
		context: string;
	};
	let { suggestedTranslations }: { suggestedTranslations: suggestedTranslation[] } = $props();
</script>

{#each suggestedTranslations as s}
	<button class="">
		<div>
			{s.match * 100}
		</div>
		{s.translation}
	 </button>
{/each}