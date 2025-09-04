//#region Languages

// For user creation - what are you an expert in...
export type AvailableLanguages = 'none' | 'spanish' | 'french' | 'portuguese';

// List of languages that are used in both front end and the ARC-Translations repo
export type Language = 'English' | 'Spanish' | 'French' | 'Portuguese';

// List of languages that can be translated into
export type TranslationLanguage = 'spanish' | 'french' | 'portuguese';

export type Profile = {
	clinical_expertise: boolean;
	created_at: '2025-02-26T14:48:01.319251+00:00';
	id: string;
	is_admin: false;
	language: AvailableLanguages;
	name: string;
};

//#endregion Languages

///  - - - - - - - - - - - - - -  ///

//#region Translation

// Which users have seen a given translation
export type ViewReport = {
	users_seen: string[];
	users_voted: string[];
};

export type Labels = 'Form' | 'Section';

// Indicates if an original text has been translated or not, or possibly needs review.
export type SegmentStatus =
	| 'complete'
	| 'incomplete'
	| 'needsReview'
	| 'skipped'
	| 'toForwardTranslate'
	| 'forwardTranslated'
	| 'toReview'
	| 'reviewed'
	| 'toBackwardTranslate'
	| 'backwardTranslated';

// Number of items for user to complete and review in a given section
export type CompletionReport = {
	complete: number;
	incomplete: number;
	needsReview: number;
};

export const CompletionStatus_Names: Partial<Record<SegmentStatus, string>> = {
	complete: 'Complete',
	incomplete: 'Incomplete',
	needsReview: 'Review',
	skipped: 'Passed'
};

// Types of larger categories, a separate system is made for each
export type Category = 'Questions' | 'Guides' | 'Labels' | 'Lists';

//#endregion Translation

///  - - - - - - - - - - - - - -  ///

//#region Table

/*

Each table is of a type, Base, Label, or Variable

 - Each table type has corresponding unique information required from it, represented by the Item.
 - The Base Item is in everything with List, Label, and Variable Items all extending this Base Table.
 - ItemForTable & TableItemMap let you find which type of table requires which Item information.

*/

// Tables
export type BaseTable = 'answer_options';
export type LabelTable = 'forms' | 'sections';
export type VariableTable = 'questions' | 'definitions' | 'completion_guides';
export type Table = BaseTable | LabelTable | VariableTable;

// Items
export interface BaseItem {
	language: TranslationLanguage;
	segment: string;
	translation: string;
}
export interface ListItem extends BaseItem {
	list: string;
	sublist: string;
}
export interface LabelItem extends BaseItem {
	form: string;
}
export interface VariableItem extends BaseItem {
	variable_id: string;
	form: string;
	section: string;
}
export interface QuestionItem extends BaseItem {
	variable_id: string;
	form: string;
	section: string;
	answers: [string];
}

// Table-Translation Type Mapping
export type TableItemMap = {
	answer_options: BaseItem;
	forms: LabelItem;
	sections: LabelItem;
	questions: VariableItem;
	definitions: VariableItem;
	completion_guides: VariableItem;
};

// Helper type to get translation type from table
export type ItemForTable<T extends Table> = T extends keyof TableItemMap ? TableItemMap[T] : never;

export type Item = BaseItem | LabelItem | VariableItem;

export interface SegmentInteraction {
	users_seen: string[];
	users_voted: string[];
	users_passed: string[];
}

// Row
export interface BaseRow {
	id: string;
	segmentInteraction: SegmentInteraction;
}

export type Row = BaseRow & Item;

export type SegmentData = {
	translations: { [translationId: string]: Row };
	completionStatus: SegmentStatus;
};

export type TableTree_Labels = {
	forms: {
		[formId: string]: {
			segments: { [segmentId: string]: SegmentData };
		};
	};
};

export type TableTree_Guides = {
	forms: {
		[formId: string]: {
			sections: {
				[sectionId: string]: {
					segments: { [segmentId: string]: SegmentData };
				};
			};
		};
	};
};

export type AddressBook = {
	forms: {
		// Addressess for each form
		[formId: string]: { branch: Branch } & {
			sections: {
				[sectionId: string]: { branch: Branch };
			};
		};
	};
};

/* 

export type AddressBook = {
	forms: {
		// Addressess for each form
		[formId: string]: { branch: Branch } & {
			labels: { [segmentId: string]: Branch };
		} & {
			sections: {
				[sectionId: string]: { branch: Branch } & {
					segments: { [segmentId: string]: Branch };
				};
			};
		};
	};
};

*/

export type Branch = {
	id: string;
	id_nav: string;
	id_label: string;
};

// Address
export interface BaseAddress {
	category?: Category;
	originalKey?: string;
	translationId?: string;
}
export interface ListAddress extends BaseAddress {
	category: 'Lists';
	listKey?: string;
	sublistKey?: string;
}
export interface LabelAddress extends BaseAddress {
	category: 'Labels';
	formKey?: string;
}
export interface QuestionGuideAddress extends BaseAddress {
	category: 'Questions' | 'Guides';
	formKey?: string;
	sectionKey?: string;
}

export type TranslationAddress = ListAddress | QuestionGuideAddress | LabelAddress | BaseAddress;

export type ForwardTranslation = {
	table: Table;
	item: Item;
	skipped: boolean;
	comment: string | null;
};

//#endregion Table

///  - - - - - - - - - - - - - -  ///

//#region Lists

export type ARCHData = {
	[variable: string]: {
		question: string;
		answerOptions: null | Record<string, string>;
		definition: string;
		completionGuide: string;
		section: string;
		form: string;
	};
};

// Holds the information needed to push a transaltions to the Lists Supabase Table
export type ListTranslation = {
	translationLanguage: TranslationLanguage; // Language
	list: string; // List 					*
	sublist: string; // Sublist 			**
	original: string; // English Version 	***
	translation: string; // Translation 	****
};

// Holds all needed infomation for a list translation
export type TranslationItem_Lists = {
	id: string;
	listTranslation: ListTranslation;
	viewReport: ViewReport;
};

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
>;

export type CompletionReports_Lists = {
	summaryReport: CompletionReport; // Overall summary across all lists/sublists
	lists: Record<
		string, // list key
		{
			listReport: CompletionReport; // CompletionReport for this list
			sublists: Record<
				string, // sublist key
				{
					sublistReport: CompletionReport; // CompletionReport for this sublist
					originalItems: Record<
						string, // original textual items (ie: United States)
						SegmentStatus // 'complete' | 'incomplete' | 'needsReview'
					>;
				}
			>;
		}
	>;
};

export type CompletionReports_Labels = {
	summaryReport: CompletionReport; // Overall summary across all lists/sublists
	form: Record<
		string, // list key
		{
			formReport: CompletionReport; // CompletionReport for this list
			originalItems: Record<
				string, // original textual items (ie: United States)
				SegmentStatus // 'complete' | 'incomplete' | 'needsReview'
			>;
		}
	>;
};

export type CompletionReports_Guides = {
	summaryReport: CompletionReport; // Overall summary across all lists/sublists
	form: Record<
		string, // list key
		{
			formReport: CompletionReport; // CompletionReport for this list
			section: Record<
				string, // sublist key
				{
					sectionReport: CompletionReport; // CompletionReport for this sublist
					originalItems: Record<
						string, // original textual items (ie: United States)
						SegmentStatus // 'complete' | 'incomplete' | 'needsReview'
					>;
				}
			>;
		}
	>;
};

//#endregion Lists
