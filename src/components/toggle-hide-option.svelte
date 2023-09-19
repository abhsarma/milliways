<script>
	import { css, cx } from '@emotion/css'
	import { select } from 'd3-selection';
	import { createEventDispatcher } from 'svelte';
	import { text, iconSize } from '../utils/dimensions.js'
	import { exclude_options } from '../utils/stores.js';
	import { colors } from '../utils/colorPallete.js';

	export let option;
	export let parameter;
	export let parameters;

	$: selected = !($exclude_options[parameter].includes(option));

	$: {
		if (selected) {
			select(`div.option-label.parameter-${parameter}.${option}`).style("opacity", "1");
		} else {
			select(`div.option-label.parameter-${parameter}.${option}`).style("opacity", "0.2");
		}
	}

	const eqSet = (xs, ys) => xs.size === ys.size && [...xs].every((x) => ys.has(x));
	const dispatch = createEventDispatcher();

	function hideOption() {
		let parameter_option_set = new Set(parameters[parameter])
		let excluded_set = new Set([...$exclude_options[parameter], option]);

		if (eqSet(parameter_option_set, excluded_set)) {
			alert("You cannot exclude all the options of a parameter as this will result in an empty set.")
		} else {
			selected = !selected;

			dispatch('hide', {
				state: selected,
				option: option,
				parameter: parameter
			});
		}
	}

	export const iconStyle = css`
		fill: ${colors.gray50};
		cursor: pointer;
		height: ${iconSize}px;
		width: ${iconSize}px;
		margin: 0px 4px;
	`;

	// export const excluded = css`
	// 	opacity: 0.2;
	// `

	// export const included = css`
	// 	opacity: 1;
	// `
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<style>
	svg.icon:hover {
		fill: var(--hoverColor);
	}
</style>

{#if selected}
	<!-- <Add class="icon" on:message={handleMessage}/> -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<svg class="icon exclude-icon {option} {iconStyle}" on:click={hideOption} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
		<path d="M0 0h24v24H0V0z" fill="none"/>
		<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
	</svg>
{:else}
	<!-- <Remove class="icon" on:message={handleMessage}/> -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<svg class="icon include-icon {option} {iconStyle}" on:click={hideOption} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
		<path d="M0 0h24v24H0V0z" fill="none"/>
		<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
	</svg>
{/if}