<script>
	import { userProfile } from '$lib/global.svelte';

	import { supabase } from '../../supabaseClient';
</script>

<button
	class="border-2 px-3 py-0.5 font-semibold rounded-md cursor-pointer
	bg-rose-500/50 hover:bg-rose-500 border-rose-800/50 hover:border-rose-800
	dark:bg-rose-900/50 dark:border-rose-600/50 dark:hover:bg-rose-900 dark:hover:border-rose-600"
	onclick={() => {
		userProfile.user = null;
		supabase.auth.signOut();
	}}
>
	Logout
</button>
