import type { DocumentRow } from '$lib/supabase/types';
import { supabase } from '../supabaseClient';
import type { LayoutLoad } from './home/$types';

export const load: LayoutLoad = async () => {
	const session = (await supabase.auth.getSession()).data.session;
	if (!session) {
		return {
			session: null,
			profile: null,
			document: null
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
			profile: null,
			document: null
		};
	}

	const selectedDocument = profile.selected_preset;
	console.log('selectedDocument:', selectedDocument);
	let document: DocumentRow | null = null;

	// * get my document
	if (selectedDocument) {
		const myDocumentRow = await supabase
			.from('documents')
			.select('*')
			.eq('title', selectedDocument)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (myDocumentRow) 
			document = myDocumentRow.data;
	} // * if I don't have one, get default document
	else {
		const defaultDocumentRow = await supabase
			.from('documents')
			.select('*')
			.eq('title', 'ARC')
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (defaultDocumentRow.data) document = defaultDocumentRow.data;
	}

	// * if still failed to get a document, get the first one it can find.
	if (document == null) {
		const defaultDocumentRow = await supabase.from('documents').select('*').limit(1).single();
		if (defaultDocumentRow.data) document = defaultDocumentRow.data;
	}

	return {
		session,
		profile,
		document
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
