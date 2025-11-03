import { supabase } from '../supabaseClient';
import type { LayoutLoad } from './home/$types';
//import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	const session = (await supabase.auth.getSession()).data.session;

	if (!session) {
		return {
			session: null,
			profile: null
		};
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', session.user.id)
		.single();

	if (!profile) {
		return {
			session: session,
			profile: null
		};
	}

	return {
		session,
		profile
	};
};

/*

Next steps:
1. get and store all locations on layout load - location tree?
2. If at a location with at least one thing in it, show the form to submit instead.
3. On submit form, simply add items to forward tree.

4. Get UI from past stuff, get it pretty
5. Load stuff stategically, maybe only original items on load, pulling in then progress, forward translations, reviews, and backward translations.

*/
