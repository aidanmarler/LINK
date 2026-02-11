<script lang="ts">
	let {
		completed, // has segment already been reviewed?
		skipped, // like "question", "answer", "label", etc./
		inProgress, // original segment
		saving, // original segment
		completedText
		//state
	}: {
		completed: boolean;
		skipped: boolean;
		inProgress: boolean;
		saving: boolean;
		completedText: string;
		//state: 'complete' | 'skipped' | 'inProgress' | 'saving';
	} = $props();
</script>

<!--Completion Indicator-->
{#if skipped && completed}
	<div
		title="Skipped"
		class=" flex items-center rounded-full border ml-1 pl-1 pr-2 text-sm font-bold opacity-70 cursor-default border-stone-800 bg-stone-800/10 text-stone-800"
	>
		<svg
			class="w-5 px-0.5 h-full stroke-stone-800 fill-stone-800 dark:stroke-stone-500 dark:fill-stone-500"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 28 28"
		>
			<path
				fill="currentColor"
				d="M15.637 4.857c-1.066-.845-2.635-.086-2.635 1.273v4.57L5.636 4.858c-1.065-.845-2.634-.086-2.634 1.273V21.87c0 1.359 1.57 2.118 2.634 1.273l7.366-5.84v4.565c0 1.359 1.57 2.118 2.634 1.273l9.637-7.64a1.917 1.917 0 0 0 0-3.004z"
			/>
		</svg>
		<span>skipped</span>
	</div>
{:else if completed}
	<div
		title="Complete"
		class=" flex items-center rounded-full border ml-1 pl-1 pr-2 text-sm font-bold opacity-70 cursor-default border-green-800 bg-green-800/10 text-green-800"
	>
		<svg
			class="w-5 h-full px-0.5 stroke-green-800 fill-green-800"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 12 12"
			stroke-width="0.5"
		>
			<path
				fill-rule="evenodd"
				d="M10.78 2.62a.75.75 0 0 1 0 1.06L4.683 9.777a.75.75 0 0 1-1.069-.009L1.211 7.284a.75.75 0 0 1 1.078-1.043l1.873 1.936L9.72 2.62a.75.75 0 0 1 1.06 0"
				clip-rule="evenodd"
			/>
		</svg>
		<span>{completedText}</span>
	</div>
{:else if saving}
	<div
		title="saving"
		class=" flex items-center rounded-full border ml-1 pl-1 pr-2 text-sm font-bold opacity-70 cursor-default border-yellow-700 bg-yellow-700/10 text-yellow-700"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="w-5 h-full p-0.5 stroke-yellow-700 fill-yellow-700"
			width="24"
			height="24"
			viewBox="0 0 24 24"
		>
			<path
				d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"
			>
				<animateTransform
					attributeName="transform"
					dur="2s"
					repeatCount="indefinite"
					type="rotate"
					values="0 12 12;360 12 12"
				/>
			</path>
		</svg>
		saving...
	</div>
{:else if inProgress && !skipped}
	<div
		title="Will save"
		class="h-5 flex items-center rounded-full border ml-1 pl-1 pr-2 text-sm font-bold opacity-70 cursor-default border-yellow-800 bg-yellow-800/10 text-yellow-700"
	>
		<svg
			class="w-5 h-full px-0.5 stroke-yellow-800 fill-yellow-700/0"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 12 12"
			stroke-width=".6"
		>
			<path
				fill-rule="evenodd"
				d="M10.78 2.62a.75.75 0 0 1 0 1.06L4.683 9.777a.75.75 0 0 1-1.069-.009L1.211 7.284a.75.75 0 0 1 1.078-1.043l1.873 1.936L9.72 2.62a.75.75 0 0 1 1.06 0"
				clip-rule="evenodd"
			/>
		</svg>
		unsaved
	</div>
{:else if skipped}
	<div
		title="Will skip"
		class="h-5 flex items-center rounded-full border ml-1 pl-1 pr-2 text-sm font-bold opacity-70 cursor-default border-yellow-800 bg-yellow-800/10 text-yellow-700"
	>
		<svg
			class="w-5 px-0.5 h-full stroke-2 stroke-yellow-800 fill-yellow-800/0"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 28 28"
		>
			<path
				d="M15.637 4.857c-1.066-.845-2.635-.086-2.635 1.273v4.57L5.636 4.858c-1.065-.845-2.634-.086-2.634 1.273V21.87c0 1.359 1.57 2.118 2.634 1.273l7.366-5.84v4.565c0 1.359 1.57 2.118 2.634 1.273l9.637-7.64a1.917 1.917 0 0 0 0-3.004z"
			/>
		</svg>
		unsaved
	</div>
{/if}
