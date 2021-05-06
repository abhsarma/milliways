<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data.json';
	import multiverseMatrix, { drawResultsMenu, drawOptionMenu } from './components/multiverseMatrix.js';
	import { cell, groupPadding, outVisWidth, margin } from './components/dimensions.js'
	import Toggle from './components/toggle-button.svelte'
	import Tooltip from './components/tooltip-option-menu.svelte'
	import Dropdown from './components/dropdown-menu.svelte'
	import OptionTooltip from './components/tooltip-option-menu.svelte'

	const m = new multiverseMatrix(data.default);
	m.prepareData();

	const params = m.parameters();

	let svg;
	const windowHeight = (window.innerHeight - 64) + "px";
	// const size = m.size;
	const cols = [...Object.keys(m.parameters())].length;
	const n_options = Object.values(params).map( d => d.length ).reduce( (a, b) => a + b, 0 );

	let gridData = m.gridData;

	$: size = gridData.length;
	$: h = size * cell.height;
	$: w1 = outVisWidth + margin.left; 
	$: w2 = (cell.width * n_options + cell.padding * (n_options - cols) + (cols + 1) * groupPadding);

	$: y = d3.scaleBand()
		.domain(d3.range(size))
		.range([margin.top, h - margin.bottom])
		.padding(0.15);

	$: x_grid = d3.scaleBand();

	onMount(() => {
		const results_node = d3.select("div.vis");
		const grid_node = d3.select("div.grid");

		drawResultsMenu(m, results_node, grid_node, y, x_grid);
		drawOptionMenu(m, results_node, grid_node, y, x_grid);

		m.draw([], results_node, grid_node, y, x_grid);
		// m.drawResults(gridData, res_container.select("svg"), y);
		// m.drawGrid(gridData, grid_container.select("svg"), x_grid, y);
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
	<div class = "container">
		<div class="row">
			<div class="col-sm-8">
				<h1 style="margin: {margin.top}px 0px">Multiverse Visualisation</h1>
			</div>
			<div class="col-sm-3">
				<Toggle/>
			</div>
		</div>
		<div style="margin: 40px 0"></div>
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