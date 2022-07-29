<script>
	import { css, cx } from '@emotion/css'
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data.json';
	import multiverseMatrix from './multiverseMatrix.js';
	import { windowHeight, header, margin } from './utils/dimensions.js'
	import { colors } from './utils/colorPallete.js';
	import { exclude_options, join_options } from './utils/stores.js'
	import Vis from './components/Vis.svelte';
	import Grid from './components/Grid.svelte';
	import ToggleSize from './components/toggle-gridSize.svelte'

	// CSS Styles
	export const container = css`
		height: ${windowHeight}px;
		overflow-y: scroll
	`;

	let m = new multiverseMatrix(data.default); 
	m.initializeData();

	function sortDirecitonCallback(event){
		m.sortIndex = event.detail
	}

	function hideOption(event) {
		let parameter = event.detail.parameter
		let option = event.detail.option

		if (!event.detail.state) {
			$exclude_options[parameter].push(option);
			d3.selectAll(`button.join.${option}`).property("disabled", true)
		} else {
			let index = $exclude_options[parameter].indexOf(option);
			d3.selectAll(`button.join.${option}`).property("disabled", false)

			if (index > -1) {
				$exclude_options[parameter].splice(index, 1);
			} else {
				console.log("error option index not found");
			}
		}

		m.updateHandler($join_options, $exclude_options);
		m = m;
	}

	function joinOptions(event) {
		let parameter = event.detail.parameter
		let option_pair = event.detail.option_pair
		let indices = event.detail.indices

		if (event.detail.state) {
			$join_options.push({'parameter': parameter, 'options': option_pair, 'indices': indices});
		} else {
			$join_options = $join_options.filter( i => (JSON.stringify(i['options']) !== JSON.stringify(option_pair)) );
		}

		m.updateHandler($join_options, $exclude_options);
		m = m;
	}

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
	document.documentElement.style.setProperty('--grayColor', colors.gray)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<main>
	<div id="leftDiv"></div>
	<div class = "container-flex">
		<div class="row">
			<h1 style="margin: {header.top}px 72px">Multiverse Visualisation</h1>
			<ToggleSize/>
		</div>
	</div>
	<div class="button-wrapper">
		<button on:click={() => { m.initializeOutcomeData(); m.updateHandler($join_options, $exclude_options); m=m; }}>
			<svg class="add-vis-icon" xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 0 24 24" width="32px" fill="{colors.active}"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
		</button>
	</div>
	<div class="main">
		<div class="{container} vis-container" style="height: {windowHeight}px;">
			{#each m.outcomes as outcome, i (outcome.id)}
				<Vis
					i              		= {i}
					data    			= {outcome}
					allOutcomeVars 		= {m.allOutcomeVars}
					bind:term      		= {outcome.var}
					bind:sortByIndex 	= {m.sortByIndex}
					bind:sortAscending 	= {m.sortAscending}
					on:changeOutcomeVar = {() =>  { m.updateOutcomeData(i, outcome.var, $join_options, $exclude_options); m = m; }}
					on:setSortIndex 	= {(event) => { m.sortByIndex = event.detail; m.updateHandler($join_options, $exclude_options); m = m; }}
					on:changeSortDirection = {() => { m.sortAscending = !m.sortAscending; m.updateHandler($join_options, $exclude_options); m = m; }}
					on:remove			= {() => { m.outcomes.splice(i,1); m = m; }}
				/>
			{/each}
		</div>
		<div class="{container} grid-container" style="height: {windowHeight}px;">
			<Grid 
				data={m.gridData} 
				parameters={m.parameters()}
				on:join={joinOptions}
				on:hide={hideOption}
			/>
		</div>
	</div>
</main>

<style>
	main {
		white-space: nowrap;
	}

	div.main {
		display: inline-block;
  		vertical-align: middle;
	}

	div.row {
		display: inline-block;
	}

	h1 {
		color: var(--activeColor) !important;
		text-transform: uppercase;
		font-family: 'Avenir Next';
		font-size: 32px;
		font-weight: 300;
		display: inline-block;
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
		display: inline-block;
		overflow-x: auto;
		margin-left: 16px;
	}

	.grid-container {
		display: inline-block;
		position: relative;
		margin-left: 16px;
	}
</style>