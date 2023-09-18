<script>
	import { css } from '@emotion/css'
	import { createEventDispatcher } from 'svelte';
	import { iconSize } from '../utils/dimensions.js'
	import { join_options, option_scale } from '../utils/stores.js';
	import { arrayEqual, any, indexOfAll } from '../utils/helpers/arrayMethods.js'
	import { colors } from '../utils/colorPallete.js';

	export let parameter;
	export let options;
	export let index;

	$: option_order =  $option_scale[parameter].domain();
	$: option_pair = [ options[option_order[index]], options[option_order[index+1]] ];
	$: indices = indexOfAll($join_options.map(d => d.parameter), parameter)
	$: selected = any(...indices.map(i => $join_options[i]).map(d => arrayEqual(d.options, option_pair)));

	const dispatch = createEventDispatcher();

	function joinOptions() {
		selected = !selected;

		dispatch('join', {
			state: selected,
			option_pair: option_pair,
			parameter: parameter,
			indices: [index, index + 1]
		});
	}

	export const iconStyle = css`
		cursor: pointer;
		height: ${iconSize}px;
		width: ${iconSize}px;
	`;

	export const buttonStyle = css`
		width: ${iconSize}px;
		height: ${iconSize}px;
		padding: 0px;
		margin: 0px;
		border: none;
		background-color: ${colors.background};
	`;

	export const link = css`
		fill: ${colors.secondary};
	`

	export const unlink = css`
		fill: ${colors.gray50};
	`

	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<style>
	svg.icon:hover {
		fill: var(--hoverColor);
	}

	button:disabled svg {
		fill: #c0c0c0;
	}
</style>

{#if !selected}
	<button class="join {buttonStyle}" on:click={joinOptions}>
		<svg class="icon link-icon {unlink} {iconStyle}" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.39 11L16 12.61V11zM17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.27-.77 2.37-1.87 2.84l1.4 1.4C21.05 15.36 22 13.79 22 12c0-2.76-2.24-5-5-5zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4.01 1.41-1.41L3.41 2.86 2 4.27z"/></svg>
	</button>
{:else}
	<button class = "join {buttonStyle}" on:click={joinOptions}>
		<svg class="icon link-icon {link} {iconStyle}" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z"/></svg>
	</button>
{/if}