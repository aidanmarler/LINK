const cardLight: string = ' bg-stone-200 border-stone-600 ';
const cardDark: string = ' dark:bg-stone-950 dark:border-stone-600 font-medium ';

const cardLight_interactions: string =
	' hover:border-stone-700 focus:border-stone-600 hover:bg-stone-50 focus:bg-stone-50 ';
const cardDark_interactions: string =
	' dark:text-stone-300 dark:hover:text-white dark:hover:bg-stone-900 dark:focus:bg-stone-700 dark:hover:border-stone-400 dark:focus:border-stone-400 dark:hover:shadow-black   ';

export const card_dynamic: string =
	cardLight +
	cardDark +
	cardLight_interactions +
	cardDark_interactions +
	' border cursor-pointer hover:shadow focus:shadow  ';

export const newStyle: string =
	cardLight +
	cardDark +
	cardLight_interactions +
	cardDark_interactions +
	' cursor-pointer hover:shadow focus:shadow  ';

export const card_static: string = cardLight + cardDark + ' border ';

export const form_element: string =
	' font-medium rounded-lg bg-stone-100 hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-700 px-2 py-0.5 rounded ';

export const button_A_active: string =
	'  cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 hover:shadow-xs hover:text-black dark:hover:text-white rounded-sm hover:border-stone-500 hover:underline ';
export const button_A_inactive: string =
	' opacity-80 font-medium rounded-sm bg-stone-300 dark:bg-stone-700 ';

export const button_B: string =
	'  border-stone-400 hover:border-stone-300 opacity-70 hover:opacity-100 border-2 bg-stone-100 p-1 font-medium cursor-pointer hover:bg-stone-50 hover:shadow-xs shadow-stone-300 rounded-lg  ';

export const button_green =
	'border-green-900 bg-green-700/20 hover:bg-green-600/50 hover:border-green-800 hover:shadow-xsx dark:border-green-800 dark:hover:bg-green-900 dark:hover:border-green-600 dark:bg-green-900/50 ';

export const style = {
	href: ' hover:underline text-blue-800 visited:text-purple-800 dark:text-blue-400 dark:visited:text-purple-400 ',
	border: ' border-stone-700 dark:border-stone-600 ',
	border_interactive:
		' border-stone-700 dark:border-stone-600 hover:border-stone-600 hover:dark:border-stone-400 '
};

export const button = {
	simple: {
		active:
			'  cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 hover:shadow-xs hover:text-black dark:hover:text-white rounded-sm hover:border-stone-500 hover:underline ',
		inactive: ' opacity-80 font-medium rounded-sm bg-stone-300 dark:bg-stone-700 '
	},
	green: {
		default: ' border-green-900 bg-green-700/20 dark:border-green-800 dark:bg-green-900/50 ',
		hover:
			' hover:bg-green-600/50 hover:border-green-800 dark:hover:bg-green-900 dark:hover:border-green-600 '
	},
	stanley:
		style.border_interactive +
		' border cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-900 hover:shadow-xs hover:text-black dark:hover:text-white hover:underline ',
	stone: 'border-stone-900 bg-stone-500/30 dark:border-stone-800 dark:bg-stone-900/50 ',
	stoneHover:
		' dark:hover:bg-stone-900 dark:hover:border-stone-600 hover:bg-stone-100 hover:border-stone-800 '

	//'border border-stone-800 dark:border-stone-600 hover:border-stone-900 hover:dark:border-stone-400' +
	//'  cursor-pointer hover:bg-stone-100/20 dark:hover:bg-stone-900 hover:text-black dark:hover:text-white '
};

export const card = {
	translate: {
		complete: ' border font-medium dark:border-stone-700 dark:bg-stone-950 ',
		incomplete:
			' shadow-sm shadow-stone-700/10 border font-medium dark:border-stone-700 dark:bg-stone-950 '
	}
};
