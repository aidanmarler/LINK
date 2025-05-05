// retrieve entire table of lists to be stored for the user
export async function retrieveTable_lists(language?: TranslationLanguage) {

    let query = supabase.from('lists').select('id, language, list, sublist, original, translation, users_seen, users_voted')

    if (language) {
        console.log("language", language)
        query = query.eq('language', language)
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching table', error);
        return [];
    }

    console.log("retrieveListsTable ", data)

    return data.map(translation => ({
        id: translation.id,
        translationLanguage: translation.language,
        list: translation.list,
        sublist: translation.sublist,
        original: translation.original,
        translation: translation.translation,
        users_seen: translation.users_seen,
        users_voted: translation.users_voted
    })) as ListTranslation[];
}

// retrieve entire table of lists with only needed columns 
// specifically for verifying what needs to be uploaded to SupaBase and what we can leave
export async function getCurrentEntries_lists() {
    const { data, error } = await supabase.from('lists').select('language, list, sublist, original, translation');

    if (error) {
        console.error('Error fetching table', error);
        return [];
    }

    return data.map(translation => ({
        translationLanguage: translation.language,
        list: translation.list,
        sublist: translation.sublist,
        original: translation.original,
        translation: translation.translation
    })) as ListTranslation[];
}
