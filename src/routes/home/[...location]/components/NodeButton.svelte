<script lang="ts">
	import { button } from '$lib/styles';
	import type { LocationNode } from '$lib/utils/locationTree';
	import { makeFolderLabel } from '$lib/utils/utils';
	import CompletionChart from '../completionChart.svelte';

	let { node, currentPath }: { node: LocationNode; currentPath: string } = $props();

	let hasGrandchildren = $derived(
		node.children.size > 0 && [...node.children.values()].some((n) => n.children.size > 0)
	);
	let hasChildren = $derived(node.children.size > 0);
</script>

<a
	title="See {node.slug}"
	class="w-full cursor-pointer {button.stone_alt.hover} p-2 rounded-lg"
	href={currentPath + '/' + node.slug}
>
	<div class="flex">
		<p class="w-full text-center">
			{#if !hasGrandchildren && !hasChildren}📋{/if}
			{makeFolderLabel(node.name)}
		</p>
	</div>

	<div class="w-full px-2">
		<CompletionChart completion={node.completion} options={{ showKey: true }} />
	</div>
</a>
