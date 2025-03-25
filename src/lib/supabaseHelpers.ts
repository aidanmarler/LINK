import { supabase } from '../supabaseClient';

export async function checkAdminStatus(userId: string): Promise<boolean> {
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('is_admin')
		.eq('id', userId)
		.single();

	if (profileError) {
		console.error('Error fetching profile:', profileError);
		return false;
	}

	return profile?.is_admin ?? false;
}

export async function addTranslationToLists(
	language: string,
	list: string,
	sublist: string,
	original: string,
	translation: string
) {
	const { error } = await supabase.from('lists').insert([
		{
			language,
			list,
			sublist,
			original,
			translation
		}
	]);

	if (error) {
		console.error('Error inserting data:', error);
	}
}

export async function insertDataIntoSupabase(
	language: string,
	list: string,
	sublist: string,
	original: string,
	translation: string
) {
	const { error } = await supabase.from('lists').insert([
		{
			language,
			list,
			sublist,
			original,
			translation
		}
	]);

	if (error) {
		console.error('Error inserting data:', error);
	}
}
