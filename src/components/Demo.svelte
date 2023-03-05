<script>
	import { onMount } from 'svelte';
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, popup } from '../utils/dimensions.js';
	import { colors } from '../utils/colorPallete.js';
	import Popup from './PopupDemo.svelte';

	export let visible_demo;
	let minimise_demo = false;

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
	let N = 7;

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
		console.log(step);
		if (step > (N + 1)) {
			console.log(step, "exceeded limit");
			removePopup(event)
		}
	}

	function removePopup(event) {
		visible_demo = false
	}

	function minimisePopup(event) {
		minimise_demo = event.detail.state;
	}
</script>

<div class="popup-demo">
	{#if !minimise_demo}
		<div class={popupBg}></div>
	{/if}
	{#if step == 0}
		<Popup 
			message = "In this demo, we show how this tool can be used to interpret the results of a multiverse analysis investigating <i>whether hurricanes with more feminine names cause more deaths</i>.<br>Interpreting the results of a multiverse analysis typically involves:<ul class='demo-list'><li>looking at the range and frequency of results to determine whether the result is consistent across all the specifications</li><li><i>if the result does exhibit variation</i>, identifying which choices or combinations of choices in the data analysis process it is most sensitive to</li></ul>"
			step = {step}
			containsImage = {false}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else if step == 1}
		<Popup 
			message = "This demo will consist of a set of three videos. After each video, please minimise this popup window and try to recreate the steps shown. Please note that the steps shown are not <span class='emphasis'>prescriptive</span>, but rather an example of how to use the tool for inference."
			step = {step}
			containsImage = {false}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else if step == 2}
		<Popup 
			message = "<video width='100%' controls><source src=https://abhsarma.github.io/assets/multiverse-vis/demos/sequence-part-1.mp4></video>"
			step = {step}
			containsImage = {true}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else if step == 3}
		<Popup 
			message = "Please minimise the popup window and try to recreate the steps shown."
			step = {step}
			containsImage = {false}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else if step == 4}
		<Popup 
			message = "<video width='100%' controls><source src=https://abhsarma.github.io/assets/multiverse-vis/demos/sequence-part-1.mp4></video>"
			step = {step}
			containsImage = {true}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else if step == 5}
		<Popup 
			message = "Please minimise the popup window and try to recreate the steps shown."
			step = {step}
			containsImage = {false}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else if step == 6}
		<Popup 
			message = "<video width='100%' controls><source src=https://abhsarma.github.io/assets/multiverse-vis/demos/sequence-part-1.mp4></video>"
			step = {step}
			containsImage = {true}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else if step == 7}
		<Popup 
			message = "Please minimise the popup window and try to recreate the steps shown."
			step = {step}
			containsImage = {false}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{:else}
		<Popup 
			message = "The steps shown in this demonstration are not prescriptive. Rather they are a demonstration of how this interface can be used to analyse and interpret the results of a multiverse analysis."
			step = {step}
			containsImage = {false}
			on:next = {updatePopup}
			on:minimise = {minimisePopup}
			on:close = {removePopup}
			steps = {N}
		/>
	{/if}
</div>

<style type="text/css">
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
