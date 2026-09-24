import type { TranslationLanguage } from '$lib/types';

export type GloabalVariables = {
	language: TranslationLanguage;
	document: string;
};
export const globalVariables: GloabalVariables = $state({ language: 'spanish', document: '' });

export const setLanguage = (l: TranslationLanguage) => {
	globalVariables.language = l;
};

export const setDocument = (d: string) => {
	globalVariables.document = d;
};
