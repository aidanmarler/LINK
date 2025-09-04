// Function to capicapitalize first character of a string
export function capitalizeFirstLetter(string: string) {
	return String(string).charAt(0).toUpperCase() + String(string).slice(1);
}

function capitalizeWords(string: string) {
    return string.replace(/\b\w/g, char => char.toUpperCase());
}

export function makeFolderLabel(string: string) {
    if (string == '') return "null";
	return capitalizeWords(string.toLowerCase()).split(':')[0].replaceAll('_', ' ');
}

export function makeFolderNav(string: string) {
    if (string == '') return "null"
	return string.split(':')[0].toLowerCase().replaceAll(' ', '_');
}

export function generateKey(strings: string[]): string {
	return strings.join('||||');
}
