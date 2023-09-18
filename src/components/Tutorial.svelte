<script>
	import { onMount } from 'svelte';
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, popup } from '../utils/dimensions.js';
	import { colors } from '../utils/colorPallete.js';
	import Popup from './Popup.svelte';
	import { parameter_scale, option_scale } from '../utils/stores.js'
	import { moveParams, moveOptions, calculateParamPosition } from '../utils/drag.js'
	import mcdf_01 from '../assets/images/mcdf-01.png'
	import mcdf_02 from '../assets/images/mcdf-02.png'
	import mcdf_03 from '../assets/images/mcdf-min-03.gif'
	import mcdf_04 from '../assets/images/mcdf-04.png'
	import mcdf_05 from '../assets/images/mcdf-min-05.gif'
	import pbox from '../assets/images/pboxes-min.gif'
	import tree from '../assets/images/tree.png'
	import groupsort from '../assets/images/grouped-sort.gif'
	import * as _ from 'lodash'

	export let parameters;
	export let multiverse;
	export let visible_tutorial;

	export const popupBg = css`
		position: absolute;
		top: 0;
		left: 0;
		min-height: 100%;
		min-width: 100%;
		background-color: ${colors.gray70 + "80"}; // rgba(151, 151, 151, 0.5)
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

	let positions;
	let step = 0;
	let N = 21;
	$: first_param = "";
	$: first_option = "";

	let p = Object.keys(parameters)[0]
	let o = Object.values(parameters)[0].slice(1, Object.values(parameters)[0].length);

	// div positioning css variables
	$: position = {x: window.innerWidth/2, y: window.innerHeight/2};

	function incrementCount() {
		step += 1;
	}

	function decrementCount() {
		step -= 1;
	}

	function resetCount() {
		step = 0;
	}

	function setLayout(toFront = "", highlightElem = "") {
		/*
		NOTE: (deprecated) these CSS styles (".to-front", ".focus-elem") are defined in this document below
		*/
		//reset any changes in order of parameters
		let param_n_options = Object.fromEntries(Object.entries(parameters).map( d => [d[0], d[1].length] ));
		$parameter_scale.domain(Object.keys(parameters))
		$parameter_scale.range(calculateParamPosition(Object.values(param_n_options)));

		Object.keys(parameters).forEach(d => {
			moveParams($parameter_scale, d)
			$option_scale[d].domain([...Array(parameters[d].length).keys()])
			parameters[d].forEach((x, i) => {
				moveOptions($option_scale, d, x, i);
			})
		})


		//reset any changes in order of options

		// reset all styles
		// reset highlight button
		document.querySelector('div.highlight').classList.add("hidden");

		// send to back all elements which were brought forward
		let elFront = Array.from(document.getElementsByClassName("to-front"));
		if (elFront.length) {
			elFront.forEach(e => {
				e.classList.remove("to-front");
			})
		}

		if (toFront) {
			document.querySelector(toFront).classList.add("to-front");
		}

		if (highlightElem) {
			let coords = document.querySelector(highlightElem).getBoundingClientRect();

			document.querySelector('div.highlight').classList.remove("hidden")
			document.querySelector('div.highlight').style.transform = `translate(${coords.x + coords.width/2 - 3}px, ${coords.y + coords.height/2 - 3}px)`;
		}

		return ""
	}

	function updatePopup(event) {
		step = Number(event.detail.step);
		if (step > N) {
			removePopup(event)
		}
	}

	function removePopup(event) {
		setLayout();
		location.reload();
		visible_tutorial = false
	}

	function getPosition(el, right = false, offset = {"x": 0, "y": 0}) {
		let coords = document.querySelector(el).getBoundingClientRect();
		let width = 0;
		if (right) width = coords.width;
		return {"x": coords.x + width + offset.x, "y": coords.y + offset.y}
	}

	onMount(() => {
		// let x_obj = Object.fromEntries(new Map([[p, o]]))

		// multiverse.setInteractions(Object.fromEntries(new Map([Object.entries(parameters)[0]])))
		

		first_param = Object.keys(parameters)[0];
		first_option = parameters[first_param][0];

		positions = {
			grid: getPosition("div.grid"),
			parameter: getPosition(`div.parameter-name.${first_param}`),
			option: getPosition(`div.option-label.${first_option}`),
			universe0: getPosition(`rect.universe-0`),
			option_interaction: getPosition(`g.parameter-col.${first_param}`),
			exclude: getPosition(`svg.exclude-icon.${first_option}`),
			join: getPosition(`.option-join`),
			vis: getPosition(`.vis-container`, true),
			result0: getPosition(`g.universe.universe-0`, true),
			code: getPosition(`div.code-container`),
			gsort: getPosition(`g.grouped-sort-divider-icon`, true, {"x": -4, "y": -16}),
			toggle: getPosition(`div.toggle`, true, {"x": 0, "y": -16})
		}
	});
</script>

<div class="popup-tutorial">
	<div class={popupBg}></div>
	{#if step == 0}
		{setLayout()}
		<!-- {multiverse.setInteractions(Object.fromEntries(new Map([Object.entries(parameters)[0]])))} -->

		<!-- .map((_, i, a) => a.slice(i, i+2)).filter(d => d.length == 2) -->
		<Popup 
			message = "<h3>Take a quick tour of <b>Milliways</b>?</h3>Walk through the interface elements and interactions to understand what you can do with Milliways."
			step = {step}
			position = {position}
			adjust = {{x:0,y:0}}
			direction = "centre"
			pointer = "hidden"
			on:next = {updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 1}
		{setLayout("div.grid-container")}
		<Popup 
			message = "This is the <span class='definition'>specification</span> panel. It shows the decisions that comprise the multiverse analysis."
			step = {step}
			position = {positions.grid}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 2}
		{setLayout("div.grid-container", `div.parameter-name.${first_param}`)}
		<Popup 
			message = "The column headers indicate the <span class='definition'>parameters</span> declared in the multiverse specification.<br><br>If we represent the decisions that comprises a multiverse as a tree, a parameter represents a decision point in the tree.<br><img style='border-radius: 8px;' src={tree} width='280' alt='representing the multiverse specification as a tree of analysis'/><br>You can change the order of the parameters by dragging on them."
			step = {step}
			position = {positions.parameter}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 3}
		{setLayout("div.grid-container", `div.option-label.${first_option}`)}
		<Popup 
			message = "The sub columns represent the possible <span class='definitions'>options</span> that each parameter can take.<br><br>You can reorder the options by dragging on them."
			step = {step}
			position = {positions.option}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 4}
		{setLayout("div.grid-container")}
		<Popup 
			message = "Each row in this grid represents a <span>universe</span>&mdash;a singular end-to-end analysis stemming from a particular combination of distinct analytical choices, which are highlighted. We show every specification in the multiverse here."
			step = {step}
			position = {positions.universe0}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 5}
		{setLayout("div.vis-container")}
		<Popup 
			message = "This is the <span class='definition'>outcome</span> panel. It shows the analysis outcomes (or estimates) from each universe in the multiverse."
			step = {step}
			position = {positions.vis}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 6}
		{setLayout("div.vis-container", "select.vis-dropdown")}
		<Popup 
			message = "The dropdown menu allows you to change which outcome variable (eg. model coefficients or effect size estimates) is being visualised in this panel."
			step = {step}
			position = {positions.vis}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 7}
		{setLayout("div.vis-container", "button.sort-button")}
		<Popup 
			message = "You can sort a variable based on the median estimate from each universe."
			step = {step}
			position = {positions.vis}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 8}
		{setLayout("div.vis-container")}
		<Popup 
			message = "Each row shows the median (black point) and the mirrored Cumulative Density Function (mCDF) of that estimate.<br><br><img style='border-radius: 8px;' src={mcdf_01} width='480' alt='mirrored CDF (mCDF) calculation'/>"
			step = {step}
			position = {positions.result0}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {true}
		/>
	{:else if step == 9}
		{setLayout("div.vis-container")}
		<Popup 
			message = "Each row shows the median (black point) and the mirrored Cumulative Density Function (mCDF) of that estimate.<br><br><img style='border-radius: 8px;' src={mcdf_02} width='480' alt='mirrored CDF (mCDF) calculation'/>"
			step = {step}
			position = {positions.result0}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {true}
		/>
	{:else if step == 10}
		{setLayout("div.vis-container")}
		<Popup 
			message = "Each row shows the median (black point) and the mirrored Cumulative Density Function (mCDF) of that estimate.<br><br><img style='border-radius: 8px;' src={mcdf_03} width='480' alt='mirrored CDF (mCDF) calculation'/>"
			step = {step}
			position = {positions.result0}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {true}
		/>
	{:else if step == 11}
		{setLayout("div.vis-container")}
		<Popup 
			message = "Each row shows the median (black point) and the mirrored Cumulative Density Function (mCDF) of that estimate.<br><br><img style='border-radius: 8px;' src={mcdf_04} width='480' alt='mirrored CDF (mCDF) calculation'/>"
			step = {step}
			position = {positions.result0}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {true}
		/>
	{:else if step == 12}
		{setLayout("div.vis-container")}
		<Popup 
			message = "Each row shows the median (black point) and the mirrored Cumulative Density Function (mCDF) of that estimate.<br><br><img style='border-radius: 8px;' src={mcdf_05} width='480' alt='mirrored CDF (mCDF) calculation'/>"
			step = {step}
			position = {positions.result0}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {true}
		/>


	{:else if step == 13}
		{setLayout("div.grid-container")}
		<Popup 
			message = "You can interact with the multiverse by <span>excluding</span> an option or <span>joining</span> two (or more) options together, and inspect which parameters and options have the greatest influence on the outcome."
			step = {step}
			position = {positions.option_interaction}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "hidden"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 14}
		{setLayout("div.grid-container", `svg.exclude-icon`)}
		<Popup 
			message = "The <span class='definition'>exclude</span> button removes every universe which includes that option from the multiverse."
			step = {step}
			position = {positions.exclude}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 15}
		{setLayout("div.grid-container", `svg.link-icon`)}
		<Popup 
			message = "The <span class='definition'>join</span> button aggregates the estimates from the universes with those options. We show the result of this aggregation on the next page."
			step = {step}
			position = {positions.join}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 16}
		{setLayout("div.vis-container")}
		{multiverse.setInteractions(Object.fromEntries(new Map([[p, o]])))}
		<Popup 
			message = "We use probability boxes (p-boxes) to show aggregated uncertainty across specifications.<br><br><img style='border-radius: 8px;' src={pbox} width='480' alt='mirrored CDF (mCDF) calculation'/>"
			step = {step}
			position = {positions.result0}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {true}
		/>
	{:else if step == 17}
		{setLayout("div.toggle")}
		{multiverse.setInteractions()}
		<Popup 
			message = "The toggle button lets you to zoom out by reducing the size of the rectangles representing each universe, and hides the uncertainty for each point estimate.<br><br>This allows you to view a larger slice of the multiverse specification (if not the entire multiverse) at a time on the screen, and can make it easier to identify patterns n the multiverse specification."
			step = {step}
			position = {positions.toggle}
			adjust = {{x:0,y:-0}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 18}
		{setLayout("div.grid-container", `g.grouped-sort-divider`)}
		<Popup 
			message = "This horizontal slider allows you to perform a <span class='definition'>sort based on group means</span>. Options of parameters to the right of the slider are sorted based on their group means, while those to the left are sorted within each group: <br><br><img style='border-radius: 8px;' src={groupsort} width='250' alt='how sorting based on group means work'/>"
			step = {step}
			position = {positions.gsort}
			adjust = {{x:0,y:-280}}
			direction = "right"
			pointer = "left"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 19}
		{setLayout("div.code-container")}
		<Popup 
			message = "This panel shows the R code used to implement the analysis. This code was used to obtain the estimates shown on the outcome panel"
			step = {step}
			position = {positions.code}
			adjust = {{x:0,y:0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{:else if step == 20}
		{setLayout("div.grid-container")}
		<Popup 
			message = "If you click on any of the rows in this grid, it will bring up the corresponding <span  class='definition'>Exploratory Multiverse Analysis Report (EMARs)</span>.<br><br>EMARs are an interactive document which describe a end-to-end analysis of one universe in the multiverse at a time."
			step = {step}
			position = {positions.universe0}
			adjust = {{x:0,y:-0}}
			direction = "left"
			pointer = "right"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>		
	{:else}
		{setLayout()}
		<Popup 
			message = "You are at the end of the tutorial."
			step = {step}
			position = {position}
			adjust = {{x:0,y:-0}}
			direction = "centre"
			pointer = "hidden"
			on:next={updatePopup}
			on:skip = {removePopup}
			steps = {N}
			containsImage = {false}
		/>
	{/if}
</div>

<style type="text/css">
	:global(.focus-elem) {
		color: var(--activeColor) !important;
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
</style>
