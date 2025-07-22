<script lang="ts">
	import { global_address, reset_address } from '$lib/global.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
        reset_address();
        console.log("global_address",$state.snapshot(global_address))
		global_address.category = 'Questions';
        console.log("global_address",$state.snapshot(global_address))
	});
</script>
