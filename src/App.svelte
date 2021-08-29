<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data2.json';
	import multiverseMatrix, { draw, CI, CDF, drawGrid } from './components/multiverseMatrix.js';
	import { cell, groupPadding, outVisWidth, margin, namingDim, iconSize, header1 } from './components/dimensions.js'
	import Toggle from './components/toggle-button.svelte'
	import Tooltip from './components/tooltip-option-menu.svelte'
	import Dropdown from './components/dropdown-menu.svelte'
	import OptionTooltip from './components/tooltip-option-menu.svelte'
	import {scrollTop} from './components/scrollTop.js'
	import Vis from './components/Vis.svelte';

	let m = new multiverseMatrix(data.default);
	let vis = CDF;
	m.initializeData(vis);
	
	const params = m.parameters();

	let svg;
	// let vis = drawCDF;
	const windowHeight = (window.innerHeight - 170) + "px";
	// const size = m.size;
	const cols = [...Object.keys(m.parameters())].length;
	const accum_options = Object.values(params).map( d => d.length )
		.reduce( (acc, val, index) => {
			if (index > 0) {
				acc.push(val + acc[acc.length - 1]);
			} else {
				acc.push(0);
				acc.push(val);
			}
			return acc; 
		}, []);

	const n_options = accum_options[accum_options.length - 1];

	$: size = m.gridData.length; // todo: reactive update
	$: h = size * cell.height;
	$: w1 = outVisWidth + margin.left; 
	$: w2 = (cell.width * n_options + cell.padding * (n_options - cols) + (cols + 1) * groupPadding);
	$: y = d3.scaleBand()
		.domain(d3.range(size))
		.range([margin.top, h - (margin.bottom + namingDim + cell.height) ])
		.padding(0.1);

	$: x_params = d3.scaleOrdinal()
		.domain(Object.keys(params))
		.range(
			accum_options.reduce((a, v, i, arr) => {
				if (i > 0) {
					let opts = (arr[i] - arr[i - 1])
					a.push(opts * cell.width + (opts - 1) * cell.padding + groupPadding + a[i - 1])
				} else {
					a.push(groupPadding)
				}
				return a;
			}, [])
		)

	// could have done `$:` instead of `let` but `let` is noticeably faster than `$:`, but we might need to do it anyway later
	let gridData = m.gridData;
	// below is being called twice when adding vis and once when removing if you put m.gridData in directly. also makes it very slow
	$: drawGrid(gridData, params, d3.select("div.grid"), y, x_params);

	// maybe move into multiverseMatrix.js
	// used for specifically changing a single <Vis/> component
	function drawVis(i) {
		m.initializeOutcomeData(i);
		m = m;
		vis(m.outcomes[i].data, d3.select('svg#vis-'+i), m.size, y);
	}

	onMount(() => {
		let grid = d3.select("div.grid")
		drawGrid(m.gridData, m.parameters(), grid, y, x_params);

		let isSyncingLeftScroll = false;
		let isSyncingRightScroll = false;
		let leftDiv = d3.select('div.vis-container').node();
		let rightDiv = d3.select('div.grid').node();
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
</script>

<style>
	main {
		white-space: nowrap;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-family: 'Avenir Next';
		font-size: 32px;
		font-weight: 300;
		display: inline-block;
	}

	svg {
		background-color: #f7f7f7;
		display: inline-block;
		float: left;
	}

	.button-wrapper button {
		position: sticky;
		left: 8px; /* page padding */
	}
	.button-wrapper button:hover {
		background-color: lightgreen;
	}
	.button-wrapper button:active {
		background-color: darkgreen;
		color: white;
	}

	.main-content {
		display: inline-block;
	}
	
	.vis-container {
		display: inline-block;
		overflow-x: auto;
	}

	.grid-container {
		display: inline-block;
		position: relative;
		margin-left: 32px;
	}

	.grid {
		display: inline-block;
		overflow-y: scroll;
	}

	/*@media (min-width: 640px) {
		main {
			max-width: none;scr
		}
	}*/
</style>

<!-- <div bind:this={el} class="chart"></div> -->

<main>
	<div id="leftDiv"></div>
	<div class = "container">
		<div class="row">
			<div class="col-sm-8">
				<h1 style="margin: {header1.top}px 0px">Multiverse Visualisation</h1>
			</div>
			<div class="col-sm-3">
				<Toggle/>
			</div>
		</div>
	</div>
	<div class="button-wrapper">
		<button on:click={() => { m.addVis(); m=m; }}>+</button>
	</div>
	<div class="main-content">
		<div class="vis-container" style="height: {windowHeight};">
			{#each m.outcomes as outcome, i (outcome.id)}
				<Vis
					i              = {i}
					allOutcomeVars = {m.allOutcomeVars}
					bind:w         = {w1}
					bind:h         = {h}
					bind:term      = {outcome.var}
					on:change      = {() => drawVis(i)}
					on:mount       = {() => drawVis(i)}
					on:remove      = {() => { m.removeVis(i); m=m; }}
				/>
			{/each}
		</div>
		<div class="grid-container">
			<div class="grid" style="height: {windowHeight}">
				<svg bind:this={svg} height={h} width={w2}></svg>
			</div>
		</div>
	</div>
</main>
