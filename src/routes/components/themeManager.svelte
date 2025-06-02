<script lang="ts">
	import { onMount } from 'svelte';

	// Initialize based on user preference or system preference
	const initialTheme = onMount(() => {
		if (typeof window !== 'undefined') {
			const theme = localStorage.getItem('theme');
			if (theme === 'true') {
				isDark = true;
			} else if (theme === 'false') {
				isDark = false;
			} else {
				isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			}
		} else {
			isDark = true;
		}

		document.documentElement.classList.toggle('dark', isDark);
	});

	let isDark = $state(true);
</script>

<button
	class=" rounded-full border-2 p-2 h-full opacity-70 transition-opacity duration-500 hover:opacity-100
	border-stone-500 bg-stone-200
	dark:bg-stone-800"
	onclick={() => {
		isDark = !$state.snapshot(isDark);
		document.documentElement.classList.toggle('dark', isDark);
	}}
>
	{#if isDark}
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<g
				fill="none"
				stroke="currentColor"
				stroke-dasharray="2"
				stroke-dashoffset="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
			>
				<path d="M12 19v1M19 12h1M12 5v-1M5 12h-1">
					<animate
						fill="freeze"
						attributeName="d"
						begin="0.36s"
						dur="0.06s"
						values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"
					/>
					<animate
						fill="freeze"
						attributeName="stroke-dashoffset"
						begin="0.36s"
						dur="0.06s"
						values="2;0"
					/>
				</path>
				<path d="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5">
					<animate
						fill="freeze"
						attributeName="d"
						begin="0.42s"
						dur="0.06s"
						values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"
					/>
					<animate
						fill="freeze"
						attributeName="stroke-dashoffset"
						begin="0.42s"
						dur="0.06s"
						values="2;0"
					/>
				</path>
			</g>
			<g fill="currentColor">
				<path
					d="M15.22 6.03L17.75 4.09L14.56 4L13.5 1L12.44 4L9.25 4.09L11.78 6.03L10.87 9.09L13.5 7.28L16.13 9.09L15.22 6.03Z"
				>
					<animate fill="freeze" attributeName="fill-opacity" dur="0.12s" values="1;0" />
				</path>
				<path
					d="M19.61 12.25L21.25 11L19.19 10.95L18.5 9L17.81 10.95L15.75 11L17.39 12.25L16.8 14.23L18.5 13.06L20.2 14.23L19.61 12.25Z"
				>
					<animate
						fill="freeze"
						attributeName="fill-opacity"
						begin="0.06s"
						dur="0.12s"
						values="1;0"
					/>
				</path>
			</g>
			<path
				fill="currentColor"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z"
			>
				<set fill="freeze" attributeName="opacity" begin="0.18s" to="0" />
			</path>
			<mask id="lineMdMoonFilledToSunnyFilledTransition0">
				<circle cx="12" cy="12" r="12" fill="#fff" />
				<circle cx="18" cy="6" r="12" fill="#fff">
					<animate fill="freeze" attributeName="cx" begin="0.18s" dur="0.12s" values="18;22" />
					<animate fill="freeze" attributeName="cy" begin="0.18s" dur="0.12s" values="6;2" />
					<animate fill="freeze" attributeName="r" begin="0.18s" dur="0.12s" values="12;3" />
				</circle>
				<circle cx="18" cy="6" r="10">
					<animate fill="freeze" attributeName="cx" begin="0.18s" dur="0.12s" values="18;22" />
					<animate fill="freeze" attributeName="cy" begin="0.18s" dur="0.12s" values="6;2" />
					<animate fill="freeze" attributeName="r" begin="0.18s" dur="0.12s" values="10;1" />
				</circle>
			</mask>
			<circle
				cx="12"
				cy="12"
				r="10"
				mask="url(#lineMdMoonFilledToSunnyFilledTransition0)"
				opacity="0"
				fill="currentColor"
			>
				<animate fill="freeze" attributeName="r" begin="0.18s" dur="0.12s" values="10;6" />
				<set fill="freeze" attributeName="opacity" begin="0.18s" to="1" />
			</circle>
		</svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path
				fill-opacity="0"
				d="M15.22 6.03L17.75 4.09L14.56 4L13.5 1L12.44 4L9.25 4.09L11.78 6.03L10.87 9.09L13.5 7.28L16.13 9.09L15.22 6.03Z"
				fill="currentColor"
			>
				<animate
					fill="freeze"
					attributeName="fill-opacity"
					begin="0.18s"
					dur="0.12s"
					values="0;1"
				/>
			</path>
			<path
				fill-opacity="0"
				d="M19.61 12.25L21.25 11L19.19 10.95L18.5 9L17.81 10.95L15.75 11L17.39 12.25L16.8 14.23L18.5 13.06L20.2 14.23L19.61 12.25Z"
				fill="currentColor"
			>
				<animate fill="freeze" attributeName="fill-opacity" begin="0.3s" dur="0.12s" values="0;1" />
			</path>
			<g
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
			>
				<g>
					<path stroke-dasharray="2" stroke-dashoffset="4" d="M12 21v1M21 12h1M12 3v-1M3 12h-1">
						<animate fill="freeze" attributeName="stroke-dashoffset" dur="0.06s" values="4;2" />
					</path>
					<path
						stroke-dasharray="2"
						stroke-dashoffset="4"
						d="M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"
					>
						<animate
							fill="freeze"
							attributeName="stroke-dashoffset"
							begin="0.06s"
							dur="0.06s"
							values="4;2"
						/>
					</path>
					<set fill="freeze" attributeName="opacity" begin="0.15s" to="0" />
				</g>
				<path
					fill="currentColor"
					d="M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z"
					opacity="0"
				>
					<set fill="freeze" attributeName="opacity" begin="0.15s" to="1" />
				</path>
			</g>
			<mask id="lineMdSunnyFilledLoopToMoonFilledTransition0">
				<circle cx="12" cy="12" r="12" fill="#fff" />
				<circle cx="22" cy="2" r="3" fill="#fff">
					<animate fill="freeze" attributeName="cx" begin="0.03s" dur="0.12s" values="22;18" />
					<animate fill="freeze" attributeName="cy" begin="0.03s" dur="0.12s" values="2;6" />
					<animate fill="freeze" attributeName="r" begin="0.03s" dur="0.12s" values="3;12" />
				</circle>
				<circle cx="22" cy="2" r="1">
					<animate fill="freeze" attributeName="cx" begin="0.03s" dur="0.12s" values="22;18" />
					<animate fill="freeze" attributeName="cy" begin="0.03s" dur="0.12s" values="2;6" />
					<animate fill="freeze" attributeName="r" begin="0.03s" dur="0.12s" values="1;10" />
				</circle>
			</mask>
			<circle
				cx="12"
				cy="12"
				r="6"
				mask="url(#lineMdSunnyFilledLoopToMoonFilledTransition0)"
				fill="currentColor"
			>
				<animate fill="freeze" attributeName="r" begin="0.03s" dur="0.12s" values="6;10" />
				<set fill="freeze" attributeName="opacity" begin="0.15s" to="0" />
			</circle>
		</svg>
	{/if}
</button>
