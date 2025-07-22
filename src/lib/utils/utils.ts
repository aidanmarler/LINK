// Function to capicapitalize first character of a string
export function capitalizeFirstLetter(string: string) {
	return String(string).charAt(0).toUpperCase() + String(string).slice(1);
}

export function generateKey(strings: string[]): string {
    return strings.join('||||');
}
