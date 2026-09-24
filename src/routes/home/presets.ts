import { invalidateAll } from "$app/navigation";

export async function handlePresetChange(preset: undefined | string) {
	// Change this user's preset
	const { error } = await supabase
		.from('profiles')
		.update({ selected_preset: preset })
		.eq('id', profile.id);

	if (error) console.error(error);

	// Reload the page
	//window.location.href = 'home'; // Full page reload

	invalidateAll(); // This re-runs all load functions
}

const _archetypeStarts = ['Disease_', 'ARChetype Disease CRF_', 'ARC'];

//let archVersion: string = $state('1.1.5');
//let archVersion: string = $derived(documents.find((d) => d.version));

let archVersion: string = $derived(
	documents.reduce((best, d) => (d.version > best ? d.version : best), '')
);
