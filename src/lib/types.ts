// For user creation - what are you an expert in...
export type AvailableLanguages = 'none' | 'spanish' | 'french' | 'portuguese';

// List of languages that are used in both front end and the ARC-Translations repo
export type Language = 'English' | 'Spanish' | 'French' | 'Portuguese';

// List of languages that can be translated into
export type TranslationLanguage = 'spanish' | 'french' | 'portuguese';


export type FilterOption = 'All Questions' | 'Dengue'


// Which users have seen a given translation
export type ViewReport = {
	users_seen: string[],
	users_voted: string[]
}

// Types of larger categories, a separate system is made for each
export type Category = 'Questions' | 'Lists' | 'Completion Guide';
export type CategoryTables = 'lists'

// This is a vital type. It is used to story the user's current address globally so that at any point, the user can access all 
export type Translation_Address = {
	category?: Category;
	listKey?: string;
	sublistKey?: string;
	originalKey?: string;
	translationId?: string;
}


// Indicates if an original text has been translated or not, or possibly needs review.
export type CompletionStatus = 'complete' | 'incomplete' | 'needsReview'

// Number of items for user to complete and review in a given section
export type CompletionReport = {
	complete: number,
	incomplete: number,
	needsReview: number
}

export const CompletionStatus_Names: Record<CompletionStatus, string> = {
	complete : "Complete",
	incomplete: "Incomplete",
	needsReview: "Review"
}

/*
export const CompletionStatus_Icons: Record<CompletionStatus, SVGElement> = {
	complete : "",
	incomplete: "Incomplete",
	needsReview: "Review"
}
*/

// Holds the information needed to push a transaltions to the Lists Supabase Table
export type Translation_Lists = {
	translationLanguage: TranslationLanguage, // Language 
	list: string, // List 					*
	sublist: string, // Sublist 			**
	original: string, // English Version 	***
	translation: string // Translation 		****
}

// Holds all needed infomation for a list translation
export type TranslationItem_Lists = {
	id: string,
	listTranslation: Translation_Lists
	viewReport: ViewReport
}

export type OriginalItem_Lists = {
	[translationId: string]: TranslationItem_Lists;
};

// Hold the actual data of items in each list and sublist (Item IDs, users voted and seen, and each translation option)
export type TreeStructure_Lists = Record<
	string, // list
	Record<
		string, // sublist
		Record<
			string, // original
			OriginalItem_Lists
		>
	>
>

export type CompletionReports_Lists = {
	summaryReport: CompletionReport, // Overall summary across all lists/sublists
	lists: Record<
		string, // list key
		{
			listReport: CompletionReport, // CompletionReport for this list
			sublists: Record<
				string, // sublist key
				{
					sublistReport: CompletionReport, // CompletionReport for this sublist
					originalItems: Record<
						string, // original textual items (ie: United States)
						CompletionStatus // 'complete' | 'incomplete' | 'needsReview'
					>
				}
			>
		}
	>
};

export type Profile = {
	clinical_expertise: boolean,
	created_at: "2025-02-26T14:48:01.319251+00:00",
	id: string,
	is_admin: false,
	language: AvailableLanguages,
	name: string
}