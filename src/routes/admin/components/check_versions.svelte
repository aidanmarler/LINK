<script lang="ts">
	import { fetchRepoData, retrieveAndUpload_Lists } from './retrieve_lists';
	import { fillSupabase } from './retrieveItems';
</script>

<p>Current Version: 1.0.3</p>
<button
	class="bg-amber-700 w-full md:w-auto font-bold hover:bg-amber-600 p-0.5 px-2 cursor-pointer"
	onclick={async () => {
		fillSupabase();
	}}
>
	Update Lists
</button>
