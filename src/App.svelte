<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data2.json';
	import multiverseMatrix, { CI, CDF, drawMatrixGrid, drawGridNames, drawOutcomes, combineJoinOptions } from './components/multiverseMatrix.js';
	import { cell, groupPadding, outVisWidth, margin, namingDim, iconSize, header1 } from './components/dimensions.js'
	import Toggle from './components/toggle-button.svelte'
	import {scrollTop} from './components/scrollTop.js'
	import Vis from './components/Vis.svelte';
	import { exclude_options, join_options } from './components/stores.js';

	let options_to_exclude;
	let options_to_join;
	const e_unsub =  exclude_options.subscribe(value => options_to_exclude=value);
	const j_unsub =  join_options.subscribe(value => options_to_join=value);

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
	$: h = size * cell.height + namingDim + margin.top + 4 * cell.padding;
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

	$: colWidth = d3.max(Object.values(params).map(d => d.length)) * (cell.width + cell.padding);
	$: x_options = d3.scaleBand()
		.domain(d3.range(d3.max(Object.values(params).map(d => d.length))))
		.range( [0, colWidth] );

	$: drawOutcomes(m.outcomes, m.size, y);
	$: update(options_to_join, options_to_exclude);

	onDestroy(() => { e_unsub(); j_unsub(); });

	onMount(() => {
		drawGridNames(m.gridData, m.parameters(), y, x_params);
		drawMatrixGrid(m.gridData, m.parameters(), y, x_params, x_options)
		// drawMatrixGrid(m.gridData, m.parameters(), y, x_params, x2)

		let isSyncingLeftScroll = false;
		let isSyncingRightScroll = false;
		let leftDiv = d3.select('.vis-container').node();
		let rightDiv = d3.select('.grid').node();
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

	function update(join, exclude) {
		let gridData = m.updateGridData(join, exclude);
		drawMatrixGrid(gridData, m.parameters(), y, x_params, x_options);
		for (let i in m.outcomes) {
			m.updateOutcomeData(i, m.allOutcomeVars[i], join, exclude);
		}		
		drawOutcomes(m.outcomes, m.size, y); // this call here feels redundant, but change from m.updateOutcomeData on line 103 is not resulting in the reactive update
	}
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
		fill: #777777;
	}

	.button-wrapper button:hover, button:active {
		background-color: lightgreen;
	}

	.button-wrapper button:hover > svg.add-vis-icon {
		background-color: lightgreen;
	}

	.main-content {
		display: inline-block;
  		vertical-align: middle;
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

	.grid {
		display: inline-block;
		overflow-y: scroll;
	}
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
		<button on:click={() => { m.initializeOutcomeData(options_to_join, options_to_exclude); m=m; }}>
			<svg class="add-vis-icon" xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 0 24 24" width="32px" fill="#777777"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
		</button>
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
					on:change	   = {() =>  { m.updateOutcomeData(i, outcome.var, options_to_join, options_to_exclude); m = m; }}
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
