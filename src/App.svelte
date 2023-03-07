<script>
	import { css, cx } from '@emotion/css'
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data.json'; // change 
    import * as code from '../static/data/code.json';
	import multiverseMatrix from './multiverseMatrix.js';
	import { windowHeight, header, margin, cell, groupPadding, nameContainer, gridNamesHeight } from './utils/dimensions.js'
	import { colors } from './utils/colorPallete.js';
	import { exclude_options, exclude_rows, join_options, parameter_scale, option_scale, group_params } from './utils/stores.js'
	import { calculateParamPosition } from './utils/drag.js';
	import Vis from './components/Vis.svelte';
	import Grid from './components/Grid.svelte';
	import ToggleSize from './components/toggle-gridSize.svelte'
	import Help from './components/help.svelte'
	import Tutorial from './components/Tutorial.svelte';
	import Demo from './components/Demo.svelte';
	import Code from './components/Code.svelte';
	import DataTable from './components/DataTable.svelte';
	import * as tableData from '../static/data/durante.json';

	let currBrushIdx = 0; // index of current Vis that brush is used on

	let showInterfaceTutorial = false;
	let showDemo = false;
	let showMenu = false;
	let showMaximizedTable = false;

	let m;
	m = new multiverseMatrix(data.default);
	m.initializeData();

	console.log("size of the multiverse: ", m.size)

	const parameters = m.parameters;

	const param_n_options = Object.fromEntries(Object.entries(parameters).map( d => [d[0], d[1].length] ));
	const n_options = Object.values(param_n_options).reduce((a, b) => a + b, 0);

	// initialise parameter and option scales
	// these are updated as stores whenever there
	// is a relevant interaction
	$parameter_scale = d3.scaleOrdinal()
		.domain(Object.keys(parameters))
		.range(calculateParamPosition(Object.values(param_n_options)));

	Object.keys(parameters).forEach(function(d, i) {
		let n = Object.values(parameters)[i].length;

		$option_scale[d] = d3.scaleBand()
								.domain( d3.range(n) )
								.range( [0, n * (cell.width + cell.padding)] );
	})

	$: {
		m.updateHandler($join_options, $exclude_options, $exclude_rows, $group_params);
		m = m;
	}

	function hideOption(event) {
		let parameter = event.detail.parameter
		let option = event.detail.option

		if (!event.detail.state) {
			$exclude_options[parameter] = [...$exclude_options[parameter], option];
		} else {
			$exclude_options[parameter] = $exclude_options[parameter].filter(d => d !== option)
		}
	}

	function joinOptions(event) {
		let parameter = event.detail.parameter
		let option_pair = event.detail.option_pair
		let indices = event.detail.indices

		if (event.detail.state) {
			$join_options = [...$join_options, {'parameter': parameter, 'options': option_pair, 'indices': indices}];
		} else {
			$join_options = $join_options.filter( i => !((i.parameter === parameter) && JSON.stringify(i['options']) === JSON.stringify(option_pair)));
		}
	}

	function sortDirecitonCallback(event){
		m.sortIndex = event.detail
	}

	function removeBrush(idx) {
		document.querySelectorAll(`#brush-container-${idx} > *`)
			.forEach((v,i) => { // removes the rectangle and other related elements
				if (i !== 0) { // the first one allows brushing behavior
					v.style.display = "none";
				}
			});
	}

	function onBrush(idx) {
		if (idx !== currBrushIdx) { // currBrushIdx is now prev
			removeBrush(currBrushIdx);
			currBrushIdx = idx;
		}
	}

	let coords_x1 = 150, coords_y1 = 150;

	onMount(() => {
		let isSyncingLeftScroll = false;
		let isSyncingRightScroll = false;
		let leftDiv = d3.select('.vis-container').node();
		let rightDiv = d3.select('.grid-container').node();
		leftDiv.onscroll = function() {
			if (!isSyncingLeftScroll) {
				isSyncingRightScroll = true;
				rightDiv.scrollTop = this.scrollTop;
			}
			isSyncingLeftScroll = false;
		}
		rightDiv.onscroll = function() {
			if (!isSyncingRightScroll) {
				isSyncingLeftScroll = true;
				leftDiv.scrollTop = this.scrollTop;
			}
			isSyncingRightScroll = false;
		}
	});

	// defining color variables for use in CSS
	document.documentElement.style.setProperty('--white', colors.white)
	document.documentElement.style.setProperty('--activeColor', colors.active)
	document.documentElement.style.setProperty('--bgColor', colors.background)
	document.documentElement.style.setProperty('--grayColor', colors.gray80)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)

	function removeEventTriggers(event) {
		if (event.target.classList[0] != 'help') {
			// hide the menu
			showMenu = false
		}
	}
</script>

<main on:click={removeEventTriggers}>
	<div class = "container-flex">
		<div class="vertical-align">
			<div class="page-header">
				<h1>Multiverse Visualisation</h1>
			</div>

			<ToggleSize/>

			<Help bind:menu={showMenu} bind:interfaceTutorial={showInterfaceTutorial} bind:demo={showDemo}/>
		</div>
	</div>

	<!-- BUTTON TO ADD A NEW OUTCOME GRAPH -->
	<div class="button-wrapper">
		<button on:click={() => { m.initializeOutcomeData(); m.updateHandler($join_options, $exclude_options); m=m; }}>
			<svg class="add-vis-icon" xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 0 24 24" width="32px" fill="{colors.active}"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
		</button>
	</div>

	<!-- CREATES THE OUTCOME GRAPH(S) -->
	<div class="main">
		<div class="highlight hidden"></div>
		<div class="vis-container" style="height: {windowHeight}px;">
			{#each m.outcomes as outcome, i (outcome.id)}
				<Vis
					i              		= {i}
					data    			= {outcome}
					allOutcomeVars 		= {m.allOutcomeVars}
					bind:term      		= {outcome.var}
					bind:sortByIndex 	= {m.sortByIndex}
					bind:sortAscending 	= {m.sortAscending}
					on:changeOutcomeVar = {() =>  { $exclude_rows=[]; removeBrush(i); m.updateOutcomeData(i, outcome.var, $join_options, $exclude_options); m = m; }}
					on:setSortIndex 	= {(event) => { m.sortByIndex = event.detail; m.updateHandler($join_options, $exclude_options); m = m; }}
					on:changeSortDirection = {() => { m.sortAscending = !m.sortAscending; m.updateHandler($join_options, $exclude_options); m = m; }}
					on:remove			= {() => { i===currBrushIdx?$exclude_rows = []:undefined; m.outcomes.splice(i,1); m = m; }}
					on:brush			= {() => onBrush(i)}
				/>
			{/each}
		</div>

		<!-- CREATES THE GRID PANEL FOR SPECIFICATIONS -->
		<div class="grid-container" style="height: {windowHeight}px;">
			<Grid 
				data={m.gridData} 
				parameters={m.parameters}
				on:join={joinOptions}
				on:hide={hideOption}
			/>
		</div>

		<div class="right-container" style="height: {windowHeight}px;">
			<!-- CREATES THE CODE PANEL FOR ANALYSIS CODE OUTPUT -->
			<div class="code-container" style="height: {windowHeight/2 - groupPadding}px">
				<Code code={code} />
			</div>

			<!-- CREATES THE DATA PANEL FOR PROVIDING OVERVIEW OF THE DATA -->
			<div class="table-container">
				<DataTable
					tableData={tableData.default}
					cellWidth=150
					h={windowHeight/2}
				/>
			</div>
		</div>
		
		{#if showInterfaceTutorial}
			<Tutorial bind:visible_tutorial={showInterfaceTutorial} parameters={m.parameters}/>
		{/if}
		{#if showDemo}
			<Demo bind:visible_demo={showDemo} parameters={m.parameters}/>
		{/if}
	</div>
</main>

<style>
	main {
		white-space: nowrap;
	}

	.hidden {
		display: none !important;
	}

	div.highlight {
		position: absolute;
		animation: highlightElem 2s ease-in-out infinite;
		border: 3px solid #E0797D;
		height: 12px;
		width: 12px;
		border-radius: 40px;
		z-index: 999;
	}

	@keyframes highlightElem{
		0% { width: 12px; height: 12px; top: -6px; left: -6px; opacity: 100% }
		50%, 100% { width: 40px; height: 40px; top: -20px; left: -20px; opacity: 0% }
	}

	div.main {
		display: inline-block;
  		vertical-align: middle;
	}

	.vertical-align {
		display: flex;
		flex-direction: row;
		margin: 32px 0px 8px 0px;
	}

	div.page-header {
		position: relative;
		padding: 8px 0px;
		height: 48px;
		width: 480px;
		margin: 0px 72px;
	}

	h1 {
		margin: 0px;
		color: var(--activeColor) !important;
		text-transform: uppercase;
		font-family: 'Avenir Next';
		font-size: 36px;
		font-weight: 300;
	}

	.button-wrapper {
		display: inline-block;
		vertical-align: middle;
	}

	.button-wrapper button {
		/*position: sticky;*/
		width: 48px;
		height: 48px;
		padding: 8px;
		border:  none;
		border-radius: 48px;
		left: 8px; /* page padding */
	}

	svg.add-vis-icon {
		/*position: sticky;*/
		fill: var(--grayColor) !important;
		cursor: pointer;
	}

	.button-wrapper button:hover, button:active {
		background-color: var(--hoverColor) !important;
		color: var(--white) !important;
	}

	.button-wrapper button:hover > svg.add-vis-icon {
		background-color: var(--hoverColor) !important;
		fill: var(--white) !important;
	}

	.vis-container {
		position:relative;
		display: inline-block;
		overflow-x: auto;
		margin-left: 16px;
		border-radius: 8px;
		overflow-y: scroll;
	}

	.grid-container {
		display: inline-block;
		position: relative;
		margin-left: 16px;
		border-radius: 8px;
		overflow-y: scroll;
		-ms-overflow-style: none;  /* IE and Edge */
	}

	.right-container {
		display: inline-flex;
		flex-direction: column;
		position: absolute;
		margin-left: 16px;
		margin-right: 16px;
	}
	
	.code-container {
		/*display: inline-flex;
		position: absolute;*/

		background-color: var(--bgColor);
		overflow-x: auto;
		margin-bottom: 8px;
		border-radius: 8px;

		overflow-y: scroll;
		-ms-overflow-style: none;  /* IE and Edge */
	}

	.table-container {
		/*	background-color: var(--bgColor);
		padding: 8px; */
		margin-top: 8px;
	}

	.maximized-table-container {
		z-index: 99;
		position: absolute;
		top:  0;
		left: 0;
		height: calc(100% - 36px);
		width: calc(100% - 36px);
		margin: 18px;
		overflow: auto;
	}

	/* Hide scrollbar for Chrome, Safari and Opera */
	.grid-container::-webkit-scrollbar {
		display: none;
	}
</style>
