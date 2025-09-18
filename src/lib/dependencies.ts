import type { ItemForTable, Table } from './types';

export const languages = ['Spanish', 'French', 'Portuguese'];
export const baseColumns = ['language', 'segment', 'translation'];
export const labelColumns = baseColumns.concat(['form']);
export const listColumns = baseColumns.concat(['list', 'sublist', 'original']);
export const guideColumns = baseColumns.concat(['form', 'section', 'variable_id']);
export const questionColumns = baseColumns.concat(['form', 'section', 'variable_id', 'answer_options']);

export const tableColumns: Record<Table|'lists', string[]> = {
	answer_options: baseColumns,
	forms: labelColumns,
	lists: listColumns,
	sections: labelColumns,
	definitions: guideColumns,
	completion_guides: guideColumns,
	questions: questionColumns
};

export const idColumns = ['id', 'users_seen', 'users_voted', 'user_created'];

export function generateItemKey<T extends Table>(table: T, item: ItemForTable<T>): string {
	 let itemKey = '';
    
    // Type-safe way to get and sort keys
    const sortedKeys = (Object.keys(item) as Array<keyof typeof item>).sort();
    
    for (const key of sortedKeys) {
        itemKey = itemKey.concat("||" + item[key]);
    }
    
    return itemKey;
}
