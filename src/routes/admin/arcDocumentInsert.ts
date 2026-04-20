import type { DocumentInsert, OriginalSegmentRow } from '$lib/supabase/types';
import _ from 'lodash';
import { supabase } from '../../supabaseClient';
import { GetArcPresets } from './findArcPresets';

async function PullAllDocumentData() {
	console.log('Pull Documnets...');
	const documents = await supabase.from('documents').select('*');
	if (documents.error) console.error('Insert error:', documents.error);

	return documents.data;
}

export async function HandleDocumentInsert(version: string, segments: OriginalSegmentRow[]) {
	// = (1) = Pull existing documents
	const existingDocuments = await PullAllDocumentData();
	if (!existingDocuments) return;

	// = (2) = Get documents to insert
	const documentsMaybeInsert = await CreateDocumentInserts(version, segments);
	if (!documentsMaybeInsert) return;

	const documentsToUpsert: DocumentInsert[] = [];

	// = (3) = Handle if document exists, update it, otherwise insert it as new
	for (const insert of documentsMaybeInsert) {
		// + store if document insert already exists
		const existingDoc = existingDocuments.find(
			(d) => d.title == insert.title && d.version == insert.version
		);
		// # if this title and version is not in arc, add it.
		if (!existingDoc) {
			documentsToUpsert.push(insert);
			continue;
		}
		// # otherwise, let's update the existing document with a union of original ids
		const existingIds = new Set(existingDoc.original_ids);
		const newIds = new Set(insert.original_ids);
		const allIds = new Set([...existingIds, ...newIds]);
		if (existingIds == allIds) continue; // ! skip if no change upon adding newIds
		const idArray = Array.from(allIds);

		// existing document, just with a new set of original_ids
		const update: DocumentInsert = { ...existingDoc, original_ids: idArray };
		documentsToUpsert.push(update);
	}

	// == Upsert all documents to upsert == //
	if (documentsToUpsert.length == 0) return;

	const upsert = await supabase
		.from('documents')
		.upsert(documentsToUpsert, { onConflict: 'id' })
		.select('*');
	if (upsert.error) console.error('Insert error:', upsert.error);

	console.log('upsert', upsert);

}

async function CreateDocumentInserts(version: string, segments: OriginalSegmentRow[]) {
	//console.log('Create Documents: ', version);
	//console.log('existingSegments', segments);

	if (segments.length == 0) return;

	// = (1) = Get arc presets to assign to documents
	const [arcPresetMap, listsPresetMap] = await GetArcPresets(version);
	console.log(arcPresetMap, listsPresetMap);

	// if variable_id == [], add simply to "ARC"
	// if variable_id == [preset_name], add to document titled "preset_name"
	// if variable_id == [all], add to all documents // @ do not think this exists

	// = (2) initialize DocumentInserts
	const documentInserts: DocumentInsert[] = [];

	const documentMap: Record<string, Set<number>> = {
		ARC: new Set()
	};

	// = (3) = add Arc variables to document
	for (const [variable, presets] of Object.entries(arcPresetMap)) {
		// Get variable(s)
		for (const s of segments) {
			// ! if not a variable type, skip
			if (!(s.type == 'question' || s.type == 'definition' || s.type == 'completionGuide'))
				continue;

			// ! if not my variable, forget it.
			if (s.location?.at(-1) != variable) continue;

			// == if this is my variable, add the variable and relavent Form, Section, and Answer Options == //

			// + initialize varible set of related ids
			const variableSet = new Set<number>();

			// + add form and sectio labels
			const loc = s.location;
			if (loc) {
				const formLab = segments.find((seg) => seg.type == 'formLabel' && seg.segment == loc[1]);
				if (formLab) variableSet.add(formLab.id);
				const secLabel = segments.find(
					(seg) => seg.type == 'sectionLabel' && seg.segment == loc[2]
				);
				if (secLabel) variableSet.add(secLabel.id);
			}

			// + add variable id
			variableSet.add(s.id);

			// + add answer option ids, if necessary
			const ao_array = s.answer_options;
			if (ao_array !== null && ao_array.length > 0) {
				for (const ao of ao_array) {
					const ao_s = segments.find((seg) => seg.type == 'answerOption' && seg.segment == ao);
					if (ao_s) variableSet.add(ao_s.id);
				}
			}

			// == Finally, add variable's set to document and presets == //
			documentMap['ARC'] = new Set([...documentMap['ARC'], ...variableSet]);
			for (const preset of presets) {
				if (!documentMap[preset]) documentMap[preset] = new Set();
				documentMap[preset] = new Set([...documentMap[preset], ...variableSet]);
			}
		}
	}

	// = (4) = add List items to document
	for (const [_list, sublists] of Object.entries(listsPresetMap)) {
		for (const [_subList, items] of Object.entries(sublists)) {
			for (const [_item, _presets] of Object.entries(items)) {
				const loc = ['Lists', _list.trim(), _subList.trim(), _item.trim()];
				const listItem = segments.find((seg) => {
					if (seg.type != 'listItem') return false;
					if (!seg.location) return false;
					return _.isEqual(seg.location, loc);
				});
				if (!listItem) continue;
				documentMap['ARC'].add(listItem.id);
				for (const preset of _presets) {
					if (!documentMap[preset]) continue;
					//if (!documentMap[preset]) documentMap[preset] = new Set();
					documentMap[preset].add(listItem.id);
				}
			}
		}
	}

	console.log('documentMap', documentMap);

	for (const [title, ids] of Object.entries(documentMap)) {
		documentInserts.push({ title: title, version: version, original_ids: Array.from(ids) });
	}

	//console.log('documentInserts', documentInserts);

	if (documentInserts.length == 0) return null;

	return documentInserts;
}
