import type { AuthSession } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import type {
	Translation_Lists,
	TranslationItem_Lists,
	Profile,
	TranslationLanguage,
	Language,
	AvailableLanguages
} from '../types';

/* Profile */
// Get Profile from UserID
export async function getProfile(session: AuthSession | null): Promise<Profile | null> {
	if (!session || !session.user) {
		console.error('No user session found');
		return null;
	}

	const { data, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', session.user.id) // assuming 'id' is the user ID column in your profiles table
		.single(); // since you're expecting only one result

	if (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}

	return data as Profile;
}

// Check if a user is an admin
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

/* Lists Initialize */
// retrieve entire table of lists with only needed columns
// specifically for verifying what needs to be uploaded to SupaBase and what we can leave
export async function getCurrentEntries_lists(language: TranslationLanguage) {
	async function pullRange(page: number, pageSize: number) {
		const { data, error } = await supabase
			.from('lists')
			.select('language, list, sublist, original, translation')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			console.error('Error fetching table', error);
			return [];
		}

		return data.map((translation) => ({
			translationLanguage: translation.language,
			list: translation.list,
			sublist: translation.sublist,
			original: translation.original,
			translation: translation.translation
		})) as Translation_Lists[];
	}

	let totalData: Translation_Lists[] = [];
	let page = 1;
	const pageSize = 1000;

	while (true) {
		console.log(page);
		if (page > 20) break;
		const rangeData = await pullRange(page, pageSize);
		console.log(rangeData.length);
		if (!rangeData || rangeData.length === 0) break; 
		totalData = totalData.concat(rangeData); // Combine results
		page++; // Go to next page
	}

	console.log('Got translations!', totalData);

	return totalData;
}

// Insert new items from ARC-Translations into supabase Lists table
export async function insertListItems(
	items: {
		language: string;
		list: string;
		sublist: string;
		original: string;
		translation: string;
	}[]
) {
	console.log('insterting ' + items.length + ' items to supabase');
	if (items.length === 0) return; // Avoid making an unnecessary request

	const { error } = await supabase.from('lists').insert(items);

	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}

	return;
}

/* Lists Get */
// function to pull entire lists table from supabase
export async function pullTable(tableName: string) {
	const { data, error } = await supabase.from(tableName).select('*');
	if (error) {
		console.error('Error fetching table ' + tableName, error);
		return [];
	}
	return data;
}

// retrieve entire table of lists to be stored for the user
export async function retrieveTable_lists(language?: TranslationLanguage) {
	let query = supabase
		.from('lists')
		.select('id, language, list, sublist, original, translation, users_seen, users_voted');

	if (language) {
		query = query.eq('language', language);
	}

	const { data, error } = await query;

	if (error) {
		console.error('Error fetching table', error);
		return [];
	}

	return data.map((translation) => ({
		id: translation.id,
		listTranslation: {
			translationLanguage: translation.language,
			list: translation.list,
			sublist: translation.sublist,
			original: translation.original,
			translation: translation.translation
		},
		viewReport: {
			users_seen: translation.users_seen,
			users_voted: translation.users_voted
		}
	})) as TranslationItem_Lists[];
}

/* Lists Upload Changes */
// Function adds user to all seen rows, if not already in it.
export async function lists_addSeenToAll(userId: string, translationIds: string[]) {
	console.log('translationIds', translationIds);
	for (const translationId of translationIds) {
		console.log('translationId', translationId);
		// Step 1: Get the translation's row
		const { data, error: fetchError } = await supabase
			.from('lists')
			.select('users_seen')
			.eq('id', translationId)
			.single();

		if (fetchError) {
			console.error('Error fetching list:', fetchError.message);
			return { success: false, error: fetchError };
		}

		// Step 2: Prepare updated users_seen array
		const usersSeen: string[] = data.users_seen || [];
		if (!usersSeen.includes(userId)) {
			usersSeen.push(userId);

			// Step 3: Update the row
			const { error: updateError } = await supabase
				.from('lists')
				.update({ users_seen: usersSeen })
				.eq('id', translationId);

			if (updateError) {
				console.error('Error updating users_seen:', updateError.message);
				return { success: false, error: updateError };
			}
		}
		console.log('successfully updated users_seen!');
	}

	return { success: true };
}
// Function removes user's votes from all seen rows, if their vote is present
export async function lists_removeVotesFromAll(userId: string, translationIds: string[]) {
	for (const translationId of translationIds) {
		// Step 1: Get the translation's row
		const { data, error: fetchError } = await supabase
			.from('lists')
			.select('users_voted')
			.eq('id', translationId)
			.single();

		if (fetchError) {
			console.error('Error fetching list:', fetchError.message);
			return { success: false, error: fetchError };
		}

		// Step 2: Prepare updated users_seen array
		const usersVoted: string[] = data.users_voted || [];
		if (usersVoted.includes(userId)) {
			const filteredUsersVoted: string[] = usersVoted.filter((id) => id !== userId);

			console.log('user found to have voted!', usersVoted, filteredUsersVoted);
			// Step 3: Update the row
			const { error: updateError } = await supabase
				.from('lists')
				.update({ users_voted: filteredUsersVoted })
				.eq('id', translationId);

			if (updateError) {
				console.error('Error updating users_seen:', updateError.message);
				return { success: false, error: updateError };
			}

			console.log('user successfully removed from voted!');
		}
	}
	return { success: true };
}
// Function handles to add user id to given rows "users_voted" column
export async function lists_addVote(userId: string, translationId: string) {
	// Step 1: Get the translation's row
	const { data, error: fetchError } = await supabase
		.from('lists')
		.select('users_voted')
		.eq('id', translationId)
		.single();

	if (fetchError) {
		console.error('Error fetching list:', fetchError.message);
		return { success: false, error: fetchError };
	}

	// Step 2: Prepare updated users_voted array
	const usersVoted: string[] = data.users_voted || [];
	if (!usersVoted.includes(userId)) {
		usersVoted.push(userId);

		// Step 3: Update the row
		const { error: updateError } = await supabase
			.from('lists')
			.update({ users_voted: usersVoted })
			.eq('id', translationId);

		if (updateError) {
			console.error('Error updating users_voted:', updateError.message);
			return { success: false, error: updateError };
		}
	}

	console.log('successfully added vote!');
	return { success: true };
}

// Function handles adding a single list item by a user
export async function lists_addOption(
	userId: string,
	language: TranslationLanguage,
	list: string,
	sublist: string,
	original: string,
	translation: string
) {
	const { error } = await supabase.from('lists').insert({
		language: language,
		list: list,
		sublist: sublist,
		original: original,
		translation: translation,
		users_seen: [userId],
		users_voted: [userId],
		user_created: userId
	});

	if (error) {
		console.error('Error adding new translation');
		return { success: false, error };
	}
	console.log('Item Added!');

	return { success: true };
}
