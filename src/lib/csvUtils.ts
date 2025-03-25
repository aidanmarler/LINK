import Papa from 'papaparse';

export async function parseCSV(url: string): Promise<any[]> {
	const response = await fetch(url);
	const text = await response.text();
	return new Promise((resolve, reject) => {
		Papa.parse(text, {
			header: false,
			complete: (results) => resolve(results.data),
			error: (error: Error) => reject(error)
		});
	});
}
