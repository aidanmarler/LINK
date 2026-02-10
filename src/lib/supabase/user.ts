import { idColumns, tableColumns } from '$lib/dependencies';
import { supabase } from '../../supabaseClient';
import type {
	Table,
	Row,
	TranslationItem_Lists,
	TranslationLanguage,
	ItemForTable,
	UserComment
} from '../types';


/*
AIDAN: I think old version code
	*/
export async function retrieveTable(table: Table | 'lists', language: TranslationLanguage) {
	const columns = idColumns.concat(tableColumns[table]).join(', ') as '*';

	async function pullRange(page: number, pageSize: number) {
		const query = supabase
			.from(table)
			.select(columns)
			.eq('language', language)
			.range((page - 1) * pageSize, page * pageSize - 1);

		const { data, error } = await query;

		if (error) {
			console.error(
				'Error fetching table:' + table + ' for ' + language,
				'page ' + page,
				columns,
				error
			);
			return [];
		}

		return data.map((row) => ({
			...row
		})) as Row[];
	}
		

	let totalData: Row[] = [];
	let page = 1;
	const pageSize = 1000;

	while (true) {
		if (page > 20) break;
		const rangeData = await pullRange(page, pageSize);
		if (!rangeData || rangeData.length === 0) break;
		totalData = totalData.concat(rangeData); // Combine results
		if (rangeData.length < 990) break;
		page++; // Go to next page
	}

	return totalData;
}

export async function userSeenTranslation(
	table: Table | 'lists',
	userId: string,
	translationIds: string[]
) {
	console.log('translationIds', translationIds);
	for (const translationId of translationIds) {
		console.log('translationId', translationId);
		// Step 1: Get the translation's row
		const { data, error: fetchError } = await supabase
			.from(table)
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
				.from(table)
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

export async function removeVotesFromAll(
	table: Table | 'lists',
	userId: string,
	translationIds: string[]
) {
	for (const translationId of translationIds) {
		// Step 1: Get the translation's row
		const { data, error: fetchError } = await supabase
			.from(table)
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
				.from(table)
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
export async function addVote(table: Table | 'lists', userId: string, translationId: string) {
	// Step 1: Get the translation's row
	const { data, error: fetchError } = await supabase
		.from(table)
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
			.from(table)
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
/*
AIDAN: I think old version code
*/
// AIDAN NOT DONE
// Function handles adding a single list item by a user
export async function addOption(
	table: Table,
	userId: string,
	language: TranslationLanguage,
	list: string,
	sublist: string,
	original: string,
	translation: string
) {
	const { error } = await supabase.from(table).insert({
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

/* Lists Upload Changes 
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
}*/
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

/*
AIDAN: I think old version code
	*/
// Insert Translations into Supabase of specified type for table.
export async function addItems<T extends Table>(
	userId: string,
	table: T,
	items: (ItemForTable<T> & UserComment)[]
): Promise<void | Error> {
	if (items.length === 0) return;

	// Mutate each item to include user_created
	const itemsWithUser = items.map((item) => ({
		...item,
		user_created: userId
	}));

	console.log(itemsWithUser);
	console.log('adding ' + itemsWithUser.length + ' new translation into ' + table, itemsWithUser);

	const { error } = await supabase.from(table).insert(itemsWithUser);
	if (error) return error;
	return;
}

