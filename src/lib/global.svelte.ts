import { tick } from "svelte";
import { retrieveTable_lists } from "./supabase/supabaseHelpers";
import type { CompletionStatus, CompletionReport, CompletionReports_Lists, TranslationItem_Lists, Profile, TranslationLanguage, TreeStructure_Lists, OriginalItem_Lists, Translation_Address } from "./types";



export const userProfile: { "user": Profile | null } = $state({ user: null });

export const loadedStatus = $state({ lists: false })

export const global_address: Translation_Address = $state({})

export const reset_address = () => {
    for (const key in global_address) {
        delete global_address[key as keyof typeof global_address];
    }
};

// Global Lists data structure - each translation of each item
export const global_lists: TreeStructure_Lists = $state({})

// Helper function to initalize empty report
const createEmptyReport = (): CompletionReport => ({
    complete: 0,
    incomplete: 0,
    needsReview: 0
});

// Global Lists completion reports - a report for all lists, each list, and each sublist
export const global_lists_report: CompletionReports_Lists = $state({
    summaryReport: createEmptyReport(),
    lists: {}
})



// Helper function to get if originalItem has been translated by the original user or not.
export function determineCompletionIndicator(userId: string, originalItem: OriginalItem_Lists): CompletionStatus {
    let seenOne = false; // user has seen at least one translation
    let seenAll = true; // user has seen all translations
    for (const translationKey in originalItem) {
        const usersSeen: string[] = originalItem[translationKey].viewReport.users_seen ?? [];
        const userHasSeen = usersSeen.includes(userId);
        if (userHasSeen) {
            seenOne = true
        }
        else {
            seenAll = false
        };
    }
    if (seenAll) return 'complete';
    if (seenOne) return 'needsReview';
    return ('incomplete')
}



// Using an array of all translations, we can set the global lists
function setGlobalLists(listTranslationsItems: TranslationItem_Lists[]) {
    for (const listTranslationsItem of listTranslationsItems) {
        const id = listTranslationsItem.id
        const { list, sublist, original } = listTranslationsItem.listTranslation
        // if no list, add it
        if (!global_lists[list]) global_lists[list] = {}
        // if no sublist, add it
        if (!global_lists[list][sublist]) global_lists[list][sublist] = {}
        // if no original, add it
        if (!global_lists[list][sublist][original]) global_lists[list][sublist][original] = {}
        // add id to address
        global_lists[list][sublist][original][id] = listTranslationsItem
    }
}


// Using userId, for each ListTranslationItem, see if user has seen it.  If each 
function setListsCompletionReport(userId: string, treeStructure_Lists: TreeStructure_Lists) {
    console.log("Setting Completion Report")
    // Step 1) Create empty table with empty completion reports
    // Step 2) Fill in low level items
    // Step 3) based on low level items, calcualte new correct completion reports

    // Step 1) look for any missing objects
    for (const listKey in treeStructure_Lists) {
        // If a missing list, add it
        if (!global_lists_report.lists[listKey]) {
            global_lists_report.lists[listKey] = {
                listReport: createEmptyReport(),
                sublists: {}
            }
        }
        // If a missing sublist, add it
        for (const sublistKey in treeStructure_Lists[listKey]) {
            if (!global_lists_report.lists[listKey].sublists[sublistKey]) {
                global_lists_report.lists[listKey].sublists[sublistKey] = {
                    sublistReport: createEmptyReport(),
                    originalItems: {}
                }
            }
            // If a missing original item, add it -> then, 
            for (const originalItemKey in treeStructure_Lists[listKey][sublistKey]) {
                // Step 2: actually fill in the low level items
                const completionIndicator: CompletionStatus = determineCompletionIndicator(userId, treeStructure_Lists[listKey][sublistKey][originalItemKey])
                global_lists_report.lists[listKey].sublists[sublistKey].originalItems[originalItemKey] = completionIndicator
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
    // Get translations based on user language, and set context
    const listsTable: TranslationItem_Lists[] = await retrieveTable_lists(language);
    setGlobalLists(listsTable);
    await tick(); // wait for svelte $state to update
    if (userProfile.user == null) {
        console.error("Profile Null when trying to update completion Report")
        return
    }
    setListsCompletionReport(userProfile.user.id, $state.snapshot(global_lists))
    await tick();
    loadedStatus.lists = true
    return
}