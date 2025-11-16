<script lang="ts">
	let { status }: { status: string } = $props();
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md">
		<div class="flex flex-col items-center gap-4">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			<p class="text-lg font-medium">{status}</p>
		</div>
	</div>
</div>
