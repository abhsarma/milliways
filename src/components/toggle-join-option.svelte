<script>
	import { css, cx } from '@emotion/css'
	import { createEventDispatcher } from 'svelte';
	import * as d3 from 'd3';
	import { text, iconSize, header1, namingDim, cell } from './dimensions.js'
	import { join_options, option_order_scale } from './stores.js';
	import { arrayEqual, any } from './helpers/arrayMethods.js'

	export let parameter;
	export let option_set;
	export let index;

	// function which returns true if any of the elements of an array contain true
	// input: array of booleans
	

	let options_to_join;
	let x_scale_options;

	join_options.subscribe(value => options_to_join = value);
	option_order_scale.subscribe(value => x_scale_options = value);

	$: option_order = x_scale_options[parameter].domain();
	$: option_pair = [option_set[option_order[index]], option_set[option_order[index+1]]];
	$: selected = any(...options_to_join.map(d => arrayEqual(d.options, option_pair)));

	const dispatch = createEventDispatcher();

	function handleMouseClick() {
		if (!selected) {
			options_to_join.push({'parameter': parameter, 'options': option_pair, 'indices': [index, index+1]});
		} else {
			options_to_join = options_to_join.filter(i => (JSON.stringify(i['options']) !== JSON.stringify(option_pair)));
		}
		join_options.update(arr => arr = options_to_join);
	}

	export const iconStyle = css`
		fill: #777777;
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
	`;
</script>

<style>
	svg.icon:hover {
		fill: #2a2a2a;
	}

	button:disabled svg {
		fill: #c0c0c0;
	}
</style>

{#if !selected}
	<button class="join unlink-button {buttonStyle}" on:click={handleMouseClick}>
		<svg class="icon link-icon {iconStyle}" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.39 11L16 12.61V11zM17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.27-.77 2.37-1.87 2.84l1.4 1.4C21.05 15.36 22 13.79 22 12c0-2.76-2.24-5-5-5zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4.01 1.41-1.41L3.41 2.86 2 4.27z"/></svg>
	</button>
{:else}
	<!-- <Remove class="icon" on:message={handleMessage}/> -->
	<button class = "join unlink-button {buttonStyle}" on:click={handleMouseClick}>
		<svg class="icon unlink-icon {iconStyle}" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z"/></svg>
	</button>
{/if}