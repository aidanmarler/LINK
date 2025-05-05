<script>
	import { userProfile } from '$lib/global.svelte';

	import { supabase } from '../../supabaseClient';
</script>

<button
	class="bg-red-900/50 border-2 border-red-600/50 px-3 py-0.5 font-semibold rounded-md cursor-pointer
						hover:bg-red-900 hover:border-red-600"
	onclick={() => {
		userProfile.user = null;
		supabase.auth.signOut();
	}}
>
	Logout
</button>
