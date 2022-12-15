<script>
	import { css, cx } from '@emotion/css'
	import { createEventDispatcher } from 'svelte';
	import * as d3 from 'd3';
	import { text, iconSize } from '../utils/dimensions.js'
	import { exclude_options } from '../utils/stores.js';
	import { any } from '../utils/helpers/arrayMethods.js'

	export let option;
	export let parameter;

	$: selected = !($exclude_options[parameter].includes(option));
	$: {
		if (selected) {
			d3.select(`div.option-label.${option}`).style("opacity", "1")
		} else {
			d3.select(`div.option-label.${option}`).style("opacity", "0.2")
		}
	}

	const dispatch = createEventDispatcher();

	function hideOption() {
		selected = !selected;

		dispatch('hide', {
			state: selected,
			option: option,
			parameter: parameter
		});
	}

	export const iconStyle = css`
		fill: #979797;
		cursor: pointer;
		height: ${iconSize}px;
		width: ${iconSize}px;
	`;
</script>

<style>
	svg.icon:hover {
		fill: #404040;
	}
</style>

{#if selected}
	<!-- <Add class="icon" on:message={handleMessage}/> -->
	<svg class="icon exclude-icon {option} {iconStyle}" on:click={hideOption} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
{:else}
	<!-- <Remove class="icon" on:message={handleMessage}/> -->
	<svg class="icon include-icon {option} {iconStyle}" on:click={hideOption} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>
{/if}