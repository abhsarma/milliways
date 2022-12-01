<script>
	import { onMount } from 'svelte';
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, popup } from '../utils/dimensions.js';
	import { colors } from '../utils/colorPallete.js';
	import PopupBox from './PopupBox.svelte';

	export let parameters;

	export const popupBg = css`
		position:absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		background-color: ${colors.gray+"80"};
		backdrop-filter: blur(3px);
		z-index: 9;
	`

	export const infoPopup = css`
		position: fixed;
		top: 50%;
		left: 50%;
		width: ${popup.width}px;
		padding: 16px;
		background-color: ${colors.popup};
		color: ${colors.text};
		border-radius: 8px;
		white-space: pre-wrap;
		z-index: 99;
	`;

	export const pointerRight  = css`
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-${popup.shift + cell.padding}px, -${popup.shift/2}px);
		width: 0; 
		height: 0;
		border-top: ${popup.shift}px solid transparent;
		border-bottom: ${popup.shift}px solid transparent;
		border-left: ${popup.shift}px solid ${colors.popup};
		z-index: 99;
	`

	export const pointerLeft  = css`
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(${cell.padding}px, ${popup.shift}px);
		width: 0; 
		height: 0;
		border-top: ${popup.shift}px solid transparent;
		border-bottom: ${popup.shift}px solid transparent;
		border-right: ${popup.shift}px solid ${colors.popup};
		z-index: 99;
	`

	export const highlight_btn = css`
		background-color: ${colors.active};
		color: ${colors.white};
	`

	export const plain_btn = css`
		color: ${colors.text};
		background-color: ${colors.popup};
	`

	export const shiftCentre = css`
		transform: translate(-50%, -50%);
	`

	export const shiftLeft = css`
		transform: translate(-${popup.width + 2*popup.padding + popup.shift + cell.padding}px, -${3*popup.shift/2}px);
	`  // add some buffer

	export const shiftRight = css`
		transform: translate(${popup.shift + cell.padding}px, 0px);
	`  // add some buffer

	let activePrev  = false, activeSkip = false, activeNext = false, positions;
	let step = 0;
	$: first_param = "";
	$: first_option = "";

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

	function focus(toFront = "", highlight = "", focusBorder = "") {
		/*
		NOTE: these CSS styles (".to-front", ".focus-elem") are defined in this document below
		*/

		// reset all styles
		// send to back all elements which were brought forward
		let elFront = Array.from(document.getElementsByClassName("to-front"));
		if (elFront.length) {
			elFront.forEach(e => {
				e.classList.remove("to-front");
			})

		}

		// understate all elements which were highlighted
		let elFocus = Array.from(document.getElementsByClassName("focus-elem"));
		if (elFocus.length) {
			elFocus.forEach(e => {
				e.classList.remove("focus-elem");
			})
		}

		// understate all elements which were highlighted
		let elFocusBorder = Array.from(document.getElementsByClassName("focus-elem-border"));
		if (elFocusBorder.length) {
			elFocusBorder.forEach(e => {
				e.classList.remove("focus-elem-border");
			})
		}

		if (toFront) {
			document.querySelector(toFront).classList.add("to-front");
		}

		if (highlight) {
			document.querySelector(highlight).classList.add("focus-elem");
		}

		if (focusBorder) {
			document.querySelector(focusBorder).classList.add("focus-elem-border");
		}
	}

	function updatePopup(event) {
		step = Number(event.detail.step)
	}

	$: console.log(step)

	function getPosition(el, right = false) {
		let coords = document.querySelector(el).getBoundingClientRect();
		let width = 0;
		if (right) width = coords.width;
		return {"x": coords.x + width, "y": coords.y}
	}

	onMount(() => {
		first_param = Object.keys(parameters)[0];
		first_option = parameters[first_param][0];

		positions = {
			grid: getPosition("div.grid"),
			parameter: getPosition(`div.parameter-name.${first_param}`),
			option: getPosition(`div.option-label.${first_option}`),
			universe0: getPosition(`rect.universe-0`), // get position of first universe which also needs to be highlighted somehow!!
			option_interaction: getPosition(`g.parameter-col.${first_param}`),
			exclude: getPosition(`svg.exclude-icon.${first_option}`),
			join: getPosition(`.option-join`),
			vis: getPosition(`.vis-container`, true),
			result0: getPosition(`g.universe.universe-0`, true),
			code: getPosition(`div.code-container`)
		}

		console.log(positions.vis)
	});
</script>

<div class="popup-tutorial">
	<div class={popupBg}></div>
	{#if step == 0}
		{focus()}
		<PopupBox 
			message = "Welcome to the multiverse visualisation tool"
			step = {step}
			position = {position}
			direction = {shiftCentre}
			on:message={updatePopup}
		/>
		<!-- <div class="{infoPopup} {shiftCentre}">
			<p>Welcome to the multiverse visualisation tool</p>
			<p class="progress-indicator">{step}/N</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>Start Tutorial</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
		</div> -->
	{:else if step == 1}
		{focus("div.grid-container")}
		<PopupBox 
			message = "This panel shows the various analytical decisions that comprises this multiverse analysis"
			step = {step}
			position = {positions.grid}
			direction = {shiftLeft}
			on:message={updatePopup}
		/>
	{:else if step == 2}
		{focus("div.grid-container", `div.parameter-name.${first_param}`)}
		<PopupBox 
			message = "The column headers indicate the parameters declared in the multiverse specification<br><br>Parameters represents a decision in the tree of decisions that comprises a multiverse analysis"
			step = {step}
			position = {positions.parameter}
			direction = {shiftLeft}
			on:message={updatePopup}
		/>
	{:else if step == 3}
		{focus("div.grid-container", `div.option-label.${first_option}`)}
		<PopupBox 
			message = "The sub columns represent options  for each parameter<br><br>Options represent the various choices for a decision in the analysis"
			step = {step}
			position = {positions.option}
			direction = {shiftLeft}
			on:message={updatePopup}
		/>
	{:else if step == 4}
		{focus("div.grid-container")}
		<PopupBox 
			message = "Each row in this grid represents a <i>universe</i>&mdash;a singular end-to-end analysis stemming from a particular combination of distinct analytical choices, which are highlighted in orange"
			step = {step}
			position = {positions.universe0}
			direction = {shiftLeft}
			on:message={updatePopup}
		/>
	{:else if step == 5}
		<PopupBox 
			message = "We provide the ability to interact with the multiverse—users can exclude and option or join two (or more) options together"
			step = {step}
			position = {positions.option_interaction}
			direction = {shiftLeft}
			on:message={updatePopup}
		/>
	{:else if step == 6}
		{focus("div.grid-container", `svg.exclude-icon`)}
		<PopupBox 
			message = "<i>Excluding</i> an option means that every universe which includes that option will be hidden"
			step = {step}
			position = {positions.exclude}
			direction = {shiftLeft}
			on:message={updatePopup}
		/>
	{:else if step == 7}
		{focus("div.grid-container", `svg.link-icon`)}
		<PopupBox 
			message = "<i>Joining options</i> mean that the estimates from the universes with those options will be aggregated"
			step = {step}
			position = {positions.join}
			direction = {shiftLeft}
			on:message={updatePopup}
		/>
	{:else if step == 8}
		{focus("div.vis-container")}
		<!-- to do from this down -->
		{position = positions.vis}
		<div class="{infoPopup} {shiftRight}" style="top: {position.y}px; left: {position.x}px;">
			<p>This panel shows the outcomes or estimates from each universe in the multiverse<br><br>The outcome or estimate variables have to be exported by the analyst at the time of preparing the multiverse</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>Next</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
			<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
		</div>
		<div class="{pointerLeft}" style="top: {position.y}px; left: {position.x}px;"></div>
	{:else if step == 9}
		{focus("div.vis-container", "", "select.vis-dropdown")}
		{position = positions.vis}
		<div class="{infoPopup} {shiftRight}" style="top: {position.y}px; left: {position.x}px;">
			<p>The dropdown menu allows you to change which variable is being visualised in this panel</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>Next</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
			<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
		</div>
		<div class="{pointerLeft}" style="top: {position.y}px; left: {position.x}px;"></div>
	{:else if step == 10}
		{focus("div.vis-container", "", "button.sort-btn")}
		{position = positions.vis}
		<div class="{infoPopup} {shiftRight}" style="top: {position.y}px; left: {position.x}px;">
			<p>You can sort the variable in ascending or descending order based on the mean or median estimate of the variable from each universe</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>Next</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
			<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
		</div>
		<div class="{pointerLeft}" style="top: {position.y}px; left: {position.x}px;"></div>
	{:else if step == 11}
		{focus("div.vis-container")}
		{position = positions.result0}
		<div class="{infoPopup} {shiftRight}" style="top: {position.y}px; left: {position.x}px;">
			<p>We show the median and the mirrored Cumulative Density Functions (CDFs) of the estimates<br><br>Mirrored CDFs are inverted and mirrored around the median</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>Next</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
			<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
		</div>
		<div class="{pointerLeft}" style="top: {position.y}px; left: {position.x}px;"></div>
	{:else if step == 12}
		{focus("div.code-container")}
		{position = positions.code}
		<div class="{infoPopup} {shiftLeft}" style="top: {position.y}px; left: {position.x}px;">
			<p>This panel shows the R code used to implement the analysis. This code was used to obtain the estimates on the left most panel</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>Next</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
			<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
		</div>
		<div class="{pointerRight}" style="top: {position.y}px; left: {position.x}px;"></div>
	{:else if step == 13}
		{focus("div.grid-container")}
		{position = positions.universe0}
		<div class="{infoPopup} {shiftLeft}" style="top: {position.y}px; left: {position.x}px;">
			<p>If you click on any of the rows in this grid, it will bring up the corresponding Exploratory Multiverse Analysis Report (EMARs), if the authors have prepared one.<br><br>EMARs are an interactive document which describe a end-to-end analysis of one universe in the multiverse at a time</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>Next</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
			<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
		</div>
		<div class="{pointerRight}" style="top: {position.y}px; left: {position.x}px;"></div>
	{:else}
		{focus()}
		<div class="{infoPopup} {shiftCentre}">
			<p>You are at the end of the tutorial</p>
			<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Finish</button>
			<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
			<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} on:click={resetCount}>Restart</button>
		</div>
	{/if}
</div>

<!-- <div class={popupBg}>
	<div bind:this={infoPopup} id="info-popup">
		<p>
			Click on any rectangle to open a new window of the analysis document with the options of the selected row displayed.
		</p>
		<button onclick="(e=>e.parentElement.parentElement.remove())(this)">
			Close
		</button>
	</div>
</div> -->

<style type="text/css">
	p {
		margin: 8px 8px 32px 8px;
		font-family: 'Avenir Next';
	}

	button {
		margin: 0px 8px;
		font-family: 'Avenir Next';
		border: none;
		padding: 8px 16px;
		float: right;
		border-radius: 4px;
	}

	:global(.focus-elem) {
		color: var(--activeColor);
		font-weight: 700;
		fill: var(--activeColor) !important;
	}

	:global(.focus-elem-border) {
		border: 1px solid var(--activeColor) !important;
		border-radius: 8px;
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
