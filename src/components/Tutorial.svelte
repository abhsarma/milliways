<script>
	import { onMount } from 'svelte';
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, popup } from '../utils/dimensions.js';
	import { colors } from '../utils/colorPallete.js';
	import Popup from './Popup.svelte';

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
	let N = 13;
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

		return ""
	}

	function updatePopup(event) {
		console.log(event.detail)
		step = Number(event.detail.step)
		if (step > (N + 1)) {
			removePopup()
			// focus();
			// document.querySelector('.popup-tutorial').remove();
		}
	}

	function removePopup(event) {
		focus();
		document.querySelector('.popup-tutorial').remove();
	}

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
	});
</script>

<div class="popup-tutorial">
	<div class={popupBg}></div>
	{#if step == 0}
		{focus()}
		<Popup 
			message = "Welcome to the multiverse visualisation tool"
			step = {step}
			position = {position}
			direction = "centre"
			on:next = {updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 1}
		{focus("div.grid-container")}
		<Popup 
			message = "This panel shows the various analytical decisions that comprises this multiverse analysis"
			step = {step}
			position = {positions.grid}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 2}
		{focus("div.grid-container", `div.parameter-name.${first_param}`)}
		<Popup 
			message = "The column headers indicate the parameters declared in the multiverse specification<br><br>Parameters represents a decision in the tree of decisions that comprises a multiverse analysis<br><br>You can change the order of the parameters by dragging on them"
			step = {step}
			position = {positions.parameter}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 3}
		{focus("div.grid-container", `div.option-label.${first_option}`)}
		<Popup 
			message = "The sub columns represent options for each parameter<br><br>Options represent the various choices for a decision in the analysis<br><br>You can reorder the options by dragging on them"
			step = {step}
			position = {positions.option}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 4}
		{focus("div.grid-container")}
		<Popup 
			message = "Each row in this grid represents a <i>universe</i>&mdash;a singular end-to-end analysis stemming from a particular combination of distinct analytical choices, which are highlighted in orange"
			step = {step}
			position = {positions.universe0}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 5}
		{focus("div.grid-container")}
		<Popup 
			message = "We provide the ability to interact with the multiverse—users can exclude and option or join two (or more) options together"
			step = {step}
			position = {positions.option_interaction}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 6}
		{focus("div.grid-container", `svg.exclude-icon`)}
		<Popup 
			message = "<i>Excluding</i> an option means that every universe which includes that option will be hidden"
			step = {step}
			position = {positions.exclude}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 7}
		{focus("div.grid-container", `svg.link-icon`)}
		<Popup 
			message = "<i>Joining options</i> mean that the estimates from the universes with those options will be aggregated"
			step = {step}
			position = {positions.join}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 8}
		{focus("div.vis-container")}
		<Popup 
			message = "This panel shows the outcomes or estimates from each universe in the multiverse<br><br>The outcome or estimate variables have to be exported by the analyst at the time of preparing the multiverse"
			step = {step}
			position = {positions.vis}
			direction = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 9}
		{focus("div.vis-container", "", "select.vis-dropdown")}
		<Popup 
			message = "The dropdown menu allows you to change which variable is being visualised in this panel"
			step = {step}
			position = {positions.vis}
			direction = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 10}
		{focus("div.vis-container", "", "button.sort-btn")}
		<Popup 
			message = "You can sort the variable in ascending or descending order based on the mean or median estimate of the variable from each universe"
			step = {step}
			position = {positions.vis}
			direction = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 11}
		{focus("div.vis-container")}
		<Popup 
			message = "We show the median and the mirrored Cumulative Density Functions (CDFs) of the estimates<br><br>Mirrored CDFs are inverted and mirrored around the median"
			step = {step}
			position = {positions.result0}
			direction = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 12}
		{focus("div.code-container")}
		<Popup 
			message = "This panel shows the R code used to implement the analysis. This code was used to obtain the estimates on the left most panel"
			step = {step}
			position = {positions.code}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else if step == 13}
		{focus("div.grid-container")}
		<Popup 
			message = "If you click on any of the rows in this grid, it will bring up the corresponding Exploratory Multiverse Analysis Report (EMARs), if the authors have prepared one.<br><br>EMARs are an interactive document which describe a end-to-end analysis of one universe in the multiverse at a time"
			step = {step}
			position = {positions.universe0}
			direction = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{:else}
		{focus()}
		<Popup 
			message = "You are at the end of the tutorial"
			step = {step}
			position = {position}
			direction = "centre"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
		/>
	{/if}
</div>

<style type="text/css">
	p {
		margin: 8px 8px 32px 8px;
		font-family: 'Avenir Next';
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
