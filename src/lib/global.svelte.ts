//#region Imports

import { tick } from 'svelte';
import { retrieveTable, retrieveTable_lists } from './supabase/user';
import type {
	SegmentStatus,
	CompletionReport,
	CompletionReports_Lists,
	TranslationItem_Lists,
	Profile,
	TranslationLanguage,
	TreeStructure_Lists,
	OriginalItem_Lists,
	TranslationAddress,
	Table,
	LabelItem,
	Row,
	BaseRow,
	TableTree_Labels,
	SegmentInteraction,
	VariableItem,
	AddressBook,
	TableTree_Variables
} from './types';
import { makeFolderLabel, makeFolderNav } from './utils/utils';

//#endregion Imports

//#region User

// Store User informmation globally
export const userProfile: { user: Profile | null } = $state({ user: null });

// Track information pulled from  Supabase
export const loadedStatus = $state({
	lists: false,
	arc: false,
	questions: false,
	answers: false,
	definitions: false,
	guides: false,
	labels: false
});

//#endregion User

//#region Address

// Track current webpage as Translation_Address
export const global_address: TranslationAddress = $state({});

// Helper to set address to {} before adding keys
export const reset_address = () => {
	for (const key in global_address) {
		delete global_address[key as keyof typeof global_address];
	}
};

//#endregion Address

//#region Trees

class TableTree {
	table: Table;
	// Using as here! Replace with satisfies?
	#data: TableTree_Labels | TableTree_Variables = $state(
		{} as TableTree_Labels | TableTree_Variables
	);
	constructor(table: Table) {
		this.table = table;
	}
	get data() {
		return this.#data;
	}

	private getCompletionStatus(
		segmentInteraction: SegmentInteraction,
		userId: string
	): SegmentStatus {
		if (segmentInteraction.users_passed.includes(userId)) return 'skipped';
		if (segmentInteraction.users_voted.includes(userId)) return 'complete';
		return 'incomplete';
	}

	hasSections(): this is { data: TableTree_Variables } {
		return (
			this.table === 'questions' ||
			this.table === 'definitions' ||
			this.table === 'completion_guides'
		);
	}

	async setTreeData(rows: Row[]): Promise<void | Error> {
		if (!userProfile.user) return new Error();

		const labelData: TableTree_Labels = { forms: {} };
		const guideData: TableTree_Variables = { forms: {} };

		switch (this.table) {
			case 'forms':
			case 'sections':
				// Iterate through each row
				// Add row data to tree at location
				for (const row of rows) {
					// Get inital info
					const labelRow = row as BaseRow & LabelItem;
					const { id, form, segment } = labelRow;

					// If no form, add form
					if (!labelData.forms[form]) labelData.forms[form] = { segments: {} };
					// If no segment, add segment
					if (!labelData.forms[form].segments[segment])
						labelData.forms[form].segments[segment] = {
							translations: {},
							completionStatus: 'incomplete'
						};

					// At location, add row to list of translations
					labelData.forms[form].segments[segment].translations[id] = labelRow;
				}
				this.#data = labelData;
				break;
			case 'questions':
			case 'definitions':
			case 'completion_guides':
				// Iterate through each row
				// Add row data to tree at location
				for (const row of rows) {
					// Get inital info
					const guideRow = row as BaseRow & VariableItem;
					const { id, form, section, segment, variable_id } = guideRow;
					// If no form, add form
					if (!guideData.forms[form]) guideData.forms[form] = { sections: {} };
					// If no section, add section
					if (!guideData.forms[form].sections[section])
						guideData.forms[form].sections[section] = { segments: {} };
					// If no segment, add segment
					if (!guideData.forms[form].sections[section].segments[segment])
						guideData.forms[form].sections[section].segments[segment] = {
							translations: {},
							completionStatus: 'incomplete',
							variableId: variable_id
						};

					// At location, add row to list of translations
					guideData.forms[form].sections[section].segments[segment].translations[id] = guideRow;
				}
				this.#data = guideData satisfies TableTree_Variables;
				break;
		}
	}
}

/*
					// Get row completion status
					const completionStatus = this.getCompletionStatus(labelRow.segmentInteraction, userId);

					// Set Completion Status
					this.#data.forms[form].originals[original].completionStatus = completionStatus;

					// Update Completion Report
					const status = $state.snapshot(
						this.#data.forms[form].originals[original].completionStatus
					);

					switch (status) {
						case 'complete':
							this.#data.forms[form].completionReport.complete += 1;
							break;
						case 'needsReview':
							this.#data.forms[form].completionReport.needsReview += 1;
							break;
						case 'incomplete':
							this.#data.forms[form].completionReport.incomplete += 1;
							break;
					}*/

export const addressBook: AddressBook = { forms: {} };

// Create more specific interfaces for each table type
export interface LabelTableTree extends TableTree {
	readonly table: 'forms' | 'sections';
	data: TableTree_Labels;
}

export interface GuideTableTree extends TableTree {
	readonly table: 'questions' | 'definitions' | 'completion_guides';
	data: TableTree_Variables;
}

// Factory functions
export function createLabelTableTree(table: 'forms' | 'sections'): LabelTableTree {
	return new TableTree(table) as LabelTableTree;
}

export function createGuideTableTree(
	table: 'questions' | 'definitions' | 'completion_guides'
): GuideTableTree {
	return new TableTree(table) as GuideTableTree;
}

// Your instances - TypeScript knows the exact type from creation!
export const formTableTree = createLabelTableTree('forms');
export const sectionTableTree = createLabelTableTree('sections');
export const guideTableTree = createGuideTableTree('completion_guides');
export const definitionTableTree = createGuideTableTree('definitions');
//export const questionsTableTree = createGuideTableTree('definitions');

export async function updateTableTrees(language: TranslationLanguage) {
	// Get data from Supabase as lists of rows
	const formsTable = await retrieveTable('forms', language);
	const sectionsTable = await retrieveTable('sections', language);
	const guidesTable = await retrieveTable('completion_guides', language);
	const definitionsTable = await retrieveTable('definitions', language);
	//const questionsTable = await retrieveTable('questions', language);
	// convert rows into Table Tree by setting the data source for the proper tree.
	await sectionTableTree.setTreeData(sectionsTable);
	await formTableTree.setTreeData(formsTable);
	await definitionTableTree.setTreeData(definitionsTable);
	await guideTableTree.setTreeData(guidesTable);
	// return when complete
	return;
}

export async function updateAddressBook() {
	// Build address book tree
	// Address - each form (id), nav format and label format
	// Forms[] -> ( Labels[] & Sections[] -> ( Questions & Definitions[] & Guides[] ) )

	for (const form in formTableTree.data?.forms) {
		const form_nav = makeFolderNav(form);
		if (!addressBook.forms[form_nav])
			addressBook.forms[form_nav] = {
				branch: {
					id: form,
					id_label: makeFolderLabel(form),
					id_nav: form_nav
				},
				sections: {}
			};
	}

	await tick().then(() => {
		if (guideTableTree.hasSections()) {
			for (const form in guideTableTree.data?.forms) {
				const form_nav = makeFolderNav(form);

				for (const section in guideTableTree.data?.forms[form_nav].sections) {
					const section_nav = makeFolderNav(section);

					if (!addressBook.forms[form_nav].sections[section_nav])
						addressBook.forms[form_nav].sections[section_nav] = {
							branch: {
								id: section,
								id_label: makeFolderLabel(section),
								id_nav: section_nav
							}
						};
				}
			}
		}
	});

	console.log('addressBook end', addressBook);
}

//#endregion Trees

//#region Lists

// Global Lists data structure - each translation of each item
export const global_lists: TreeStructure_Lists = $state({});

// Helper function to initalize empty report
const emptyReport = (): CompletionReport => ({
	complete: 0,
	incomplete: 0,
	needsReview: 0
});

// Global Lists completion reports - a report for all lists, each list, and each sublist
export const global_lists_report: CompletionReports_Lists = $state({
	summaryReport: emptyReport(),
	lists: {}
});

// Helper function to get if originalItem has been translated by the original user or not.
export function determineCompletionIndicator(
	userId: string,
	originalItem: OriginalItem_Lists
): SegmentStatus {
	let seenOne = false; // user has seen at least one translation
	let seenAll = true; // user has seen all translations
	for (const translationKey in originalItem) {
		const usersSeen: string[] = originalItem[translationKey].viewReport.users_seen ?? [];
		const userHasSeen = usersSeen.includes(userId);
		if (userHasSeen) {
			seenOne = true;
		} else {
			seenAll = false;
		}
	}
	if (seenAll) return 'complete';
	if (seenOne) return 'needsReview';
	return 'incomplete';
}

// Using an array of all translations, we can set the global lists
function setGlobalLists(listTranslationsItems: TranslationItem_Lists[]) {
	for (const listTranslationsItem of listTranslationsItems) {
		const id = listTranslationsItem.id;
		const { list, sublist, original } = listTranslationsItem.listTranslation;
		// if no list, add it
		if (!global_lists[list]) global_lists[list] = {};
		// if no sublist, add it
		if (!global_lists[list][sublist]) global_lists[list][sublist] = {};
		// if no original, add it
		if (!global_lists[list][sublist][original]) global_lists[list][sublist][original] = {};
		// add id to address
		global_lists[list][sublist][original][id] = listTranslationsItem;
	}
}

// Using userId, for each ListTranslationItem, see if user has seen it.  If each
function setListsCompletionReport(userId: string, treeStructure_Lists: TreeStructure_Lists) {
	//console.log('Setting Completion Report');
	// Step 1) Create empty table with empty completion reports
	// Step 2) Fill in low level items
	// Step 3) based on low level items, calcualte new correct completion reports

	// Step 1) look for any missing objects
	for (const listKey in treeStructure_Lists) {
		// If a missing list, add it
		if (!global_lists_report.lists[listKey]) {
			global_lists_report.lists[listKey] = {
				listReport: emptyReport(),
				sublists: {}
			};
		}
		// If a missing sublist, add it
		for (const sublistKey in treeStructure_Lists[listKey]) {
			if (!global_lists_report.lists[listKey].sublists[sublistKey]) {
				global_lists_report.lists[listKey].sublists[sublistKey] = {
					sublistReport: emptyReport(),
					originalItems: {}
				};
			}
			// If a missing original item, add it -> then,
			for (const originalItemKey in treeStructure_Lists[listKey][sublistKey]) {
				// Step 2: actually fill in the low level items
				const completionIndicator: SegmentStatus = determineCompletionIndicator(
					userId,
					treeStructure_Lists[listKey][sublistKey][originalItemKey]
				);
				global_lists_report.lists[listKey].sublists[sublistKey].originalItems[originalItemKey] =
					completionIndicator;
			}
		}
	}

	// Step 3: Calculate reports upward from originalItems
	let globalComplete = 0;
	let globalIncomplete = 0;
	let globalToReview = 0;

	for (const listKey in global_lists_report.lists) {
		const listData = global_lists_report.lists[listKey];
		let listComplete = 0;
		let listIncomplete = 0;
		let listToReview = 0;

		for (const sublistKey in listData.sublists) {
			const sublistData = listData.sublists[sublistKey];
			let sublistComplete = 0;
			let sublistIncomplete = 0;
			let sublistToReview = 0;

			for (const originalKey in sublistData.originalItems) {
				const status = sublistData.originalItems[originalKey];
				if (status === 'complete') sublistComplete++;
				else if (status === 'incomplete') sublistIncomplete++;
				else if (status === 'needsReview') sublistToReview++;
			}

			// Save sublist report
			sublistData.sublistReport = {
				complete: sublistComplete,
				incomplete: sublistIncomplete,
				needsReview: sublistToReview
			};

			// Add to list-level counters
			listComplete += sublistComplete;
			listIncomplete += sublistIncomplete;
			listToReview += sublistToReview;
		}

		// Save list report
		listData.listReport = {
			complete: listComplete,
			incomplete: listIncomplete,
			needsReview: listToReview
		};

		// Add to global counters
		globalComplete += listComplete;
		globalIncomplete += listIncomplete;
		globalToReview += listToReview;
	}

	// Save summary report
	global_lists_report.summaryReport = {
		complete: globalComplete,
		incomplete: globalIncomplete,
		needsReview: globalToReview
	};
}

// Function gets all Tables for user's language to visualize them and use them to generate pages and questions.
export async function updateGlobalTables(language: TranslationLanguage) {
	await updateTableTrees(language);
	// 1 - retrieve tables from SupaBase
	// 2 - set as global $state()
	// 3 - set completion report
	// 4 - set loaded as true

	//const formsTable = await retrieveTable('forms', language);
	//setTableGlobalState('forms', formsTable);
	/*
	const sectionsTable = await retrieveTable('sections', language);
	setTableGlobalState('sections', sectionsTable);
	const guidesTable = await retrieveTable('completion_guides', language);
	setTableGlobalState('completion_guides', guidesTable);
	const definitionsTable = await retrieveTable('definitions', language);
	setTableGlobalState('definitions', definitionsTable);
	console.log(formsTable, sectionsTable, guidesTable, definitionsTable);*/

	// Get translations based on user language, and set context
	const listsTable: TranslationItem_Lists[] = await retrieveTable_lists(language);
	setGlobalLists(listsTable);
	await tick(); // wait for svelte $state to update
	if (userProfile.user == null) {
		console.error('Profile Null when trying to update completion Report');
		return;
	}
	setListsCompletionReport(userProfile.user.id, $state.snapshot(global_lists));
	await tick();
	loadedStatus.lists = true;

	await updateAddressBook();

	loadedStatus.arc = true;

	return;
}

export const address = $state({
	form: null,
	section: null
});
//#endregion Lists
