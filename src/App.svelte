<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data2.json';
	import multiverseMatrix, { draw, drawResultsMenu, CI, CDF } from './components/multiverseMatrix.js';
	import { cell, groupPadding, outVisWidth, margin, namingDim, iconSize, header1 } from './components/dimensions.js'
	import Toggle from './components/toggle-button.svelte'
	import Tooltip from './components/tooltip-option-menu.svelte'
	import Dropdown from './components/dropdown-menu.svelte'
	import OptionTooltip from './components/tooltip-option-menu.svelte'
	import {scrollTop} from './components/scrollTop.js'

	const m = new multiverseMatrix(data.default);
	let vis = CDF;
	m.prepareData(vis);

	const params = m.parameters();

	let svg;
	// let vis = drawCDF;
	const windowHeight = (window.innerHeight - 64) + "px";
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

	let gridData = m.gridData;

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

	onMount(() => {
		const results_node = d3.select("div.vis");
		const grid_node = d3.select("div.grid");

		drawResultsMenu(m, results_node, grid_node, vis, y, x_params); //, x_opts);
		// drawOptionMenu(m, results_node, grid_node, y, x_grid);

		$: draw(m, [], results_node, grid_node, vis, y, x_params); //, x_opts);


		let isSyncingLeftScroll = false;
		let isSyncingRightScroll = false;
		let leftDiv = d3.select('div.vis').node();
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

	div.grid-container {
		display: inline-block;
		position: relative;
		margin-left: 32px;
	}

	div.grid {
		display: inline-block;
		overflow-y: scroll;
	}

	div.vis {
		display: inline-block;
		float: left;
		overflow-y: auto;
	}

	/*@media (min-width: 640px) {
		main {
			max-width: none;
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
		<div class="vis" style="height: {windowHeight}">
			<svg bind:this={svg} height={h} width={w1}></svg>
		</div>
		<div class="grid-container">
			<div class="grid" style="height: {windowHeight}">
				<svg bind:this={svg} height={h} width={w2}></svg>
			</div>
		</div>
	</div>
</main>
