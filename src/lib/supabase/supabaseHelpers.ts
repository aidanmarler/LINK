import type { AuthSession } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import type {
	ListTranslation,
	TranslationItem_Lists,
	Profile,
	TranslationLanguage,
	VariableTranslation,
	SimpleTranslation,
	SimpleTranslationTable,
	VariableTranslationTable
} from '../types';
import { generateKey } from '$lib/utils';

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
		})) as ListTranslation[];
	}

	let totalData: ListTranslation[] = [];
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

export async function getCurrentEntries_questions(language: TranslationLanguage) {
	async function pullRange(page: number, pageSize: number) {
		const { data, error } = await supabase
			.from('questions')
			.select('variable_id, original')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);
		if (error) {
			console.error('Error fetching table', error);
			return {};
		}
		const range_variables: Record<string, string> = Object.fromEntries(
			data.map((item) => [item.variable_id, item.original])
		);
		return range_variables;
	}

	let variables: Record<string, string> = {};
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 40) break;
		const rangeData: Record<string, string> = await pullRange(page, pageSize);
		if (!rangeData || Object.keys(rangeData).length == 0) break;
		variables = { ...variables, ...rangeData };
		if (Object.keys(rangeData).length < pageSize) break;
		page++; // Go to next page
	}

	return variables;
}

export async function getExistingSimpleTranslations(
	table: SimpleTranslationTable,
	language: TranslationLanguage
): Promise<Map<string, SimpleTranslation>> {
	async function pullRange(page: number, pageSize: number): Promise<SimpleTranslation[]> {
		const { data, error } = await supabase
			.from(table)
			.select('original, translation')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			console.error('Error fetching ' + table, error);
			return [];
		}

		const range_data: SimpleTranslation[] = data.map((item) => ({
			language: language,
			original: item.original,
			translation: item.translation
		}));

		return range_data;
	}

	const allData = new Map<string, SimpleTranslation>();
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 20) break;
		const rangeData: SimpleTranslation[] = await pullRange(page, pageSize);
		if (!rangeData || rangeData.length === 0) break;

		// Generate keys and add to Map
		rangeData.forEach((item) => {
			const key = generateKey([item.language, item.original, item.translation]);
			allData.set(key, item);
		});

		if (rangeData.length < pageSize) break;
		page++;
	}

	return allData;
}

export async function getExistingVariableTranslations(
	table: VariableTranslationTable,
	language: TranslationLanguage
): Promise<Map<string, VariableTranslation>> {
	async function pullRange(page: number, pageSize: number): Promise<VariableTranslation[]> {
		const { data, error } = await supabase
			.from(table)
			.select('variable_id, original, translation, form, section')
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			console.error('Error fetching ' + table, error);
			return [];
		}

		const range_data: VariableTranslation[] = data.map((item) => ({
			language: language,
			original: item.original,
			translation: item.translation,
			variable_id: item.variable_id,
			form: item.form,
			section: item.section
		}));

		return range_data;
	}

	const allData = new Map<string, VariableTranslation>();
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 20) break;
		const rangeData: VariableTranslation[] = await pullRange(page, pageSize);
		if (!rangeData || rangeData.length === 0) break;

		// Generate keys and add to Map
		rangeData.forEach((item) => {
			const key = generateKey([item.variable_id, item.language, item.original, item.translation]);
			allData.set(key, item);
		});

		if (rangeData.length < pageSize) break;
		page++;
	}

	return allData;
}

// Insert new items from ARC-Translations into supabase Lists table
export async function insertListItems(items: ListTranslation[]) {
	console.log('insterting ' + items.length + ' items to supabase');
	if (items.length === 0) return; // Avoid making an unnecessary request

	const { error } = await supabase.from('lists').insert(items);

	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}

	return;
}
// Insert new items from ARC-Translations into supabase Lists table
export async function insertQuestionItems(items: VariableTranslation[]) {
	console.log('insterting ' + items.length + ' items to supabase');
	if (items.length === 0) return; // Avoid making an unnecessary request

	const { error } = await supabase.from('questions').insert(items);

	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}

	console.log('success!');

	return;
}

export async function insertTranslations(
	table: SimpleTranslationTable,
	translations: Map<string, SimpleTranslation>
): Promise<void | Error>;
export async function insertTranslations(
	table: VariableTranslationTable,
	translations: Map<string, VariableTranslation>
): Promise<void | Error>;
export async function insertTranslations(
	table: SimpleTranslationTable | VariableTranslationTable,
	translations: Map<string, SimpleTranslation> | Map<string, VariableTranslation>
): Promise<void | Error> {
	console.log('inserting ' + translations.size + ' items to supabase');
	if (translations.size === 0) return;
	const { error } = await supabase.from(table).insert(Array.from(translations.values()));
	if (error) {
		console.error('Error inserting data:', error);
		return error;
	}
	console.log('success!');
	return;
}

/* Lists Get */
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
