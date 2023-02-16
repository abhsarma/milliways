<script>
	import { onMount } from 'svelte';
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, popup } from '../utils/dimensions.js';
	import { colors } from '../utils/colorPallete.js';
	import Popup from './PopupDemo.svelte';
	import { parameter_scale, option_scale } from '../utils/stores.js'
	import { moveParams, moveOptions, calculateParamPosition } from '../utils/drag.js'
	import mcdf from '../assets/images/mcdf.png'
	import groupsort from '../assets/images/grouped-sort.gif'

	export let parameters;
	export let visible;

	export const popupBg = css`
		position:absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		background-color: ${colors.gray70 + "80"};
		backdrop-filter: blur(3px);
		z-index: 20;
	`
	export const highlight_btn = css`
		background-color: ${colors.active};
		color: ${colors.white};
	`

	export const plain_btn = css`
		color: ${colors.text};
		background-color: ${colors.popup};
	`

	let activePrev  = false, activeSkip = false, activeNext = false, positions;
	let step = 0;
	let N = 15;

	// div positioning css variables
	$: position = {x: window.innerWidth/2, y: window.innerHeight/2};

	function incrementCount() {
		step += 1;
		activePrev  = false;
		activeSkip = false;
		activeNext = false;
	}

	function decrementCount() {
		step -= 1;
		activePrev  = false;
		activeSkip = false;
		activeNext = false;
	}

	function resetCount() {
		step = 0;
		activePrev  = false;
		activeSkip = false;
		activeNext = false;
	}

	function updatePopup(event) {
		step = Number(event.detail.step)
		if (step > (N + 1)) {
			removePopup(event)
		}
	}

	function removePopup(event) {
		visible = false
	}
</script>

<div class="popup-demo">
	<div class={popupBg}></div>
	{#if step == 0}
		<Popup 
			message = "In this demonstration, we show how this interactive visualisation tool can be used to interpret the results of a multiverse analysis investigating whether hurricanes with more feminine names cause more deaths."
			step = {step}
			position = {position}
			adjust = {{x:0,y:0}}
			direction = "centre"
			on:next = {updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{/if}
</div>

<style type="text/css">
	i {
		color: red;
	}

	:global(.to-front) {
		z-index: 99;
	}

	.activePrev  {
		background-color: #e0e0e0;
		cursor: pointer;
	}

	.activeSkip {
		background-color: #e0e0e0;
		cursor: pointer;
	}

	.activeNext {
    	background-color: #ED8A68;
    	cursor: pointer;
    }
</style>
