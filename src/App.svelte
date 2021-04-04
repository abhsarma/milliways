<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/multiverse_table.json';
	import multiverseMatrix from './components/multiverseMatrix.js';
	import { cell, groupPadding, outVisWidth, margin } from './components/dimensions.js'

	console.log(data.default);
	const m = new multiverseMatrix(data.default);
	const params = m.parameters();

	const windowHeight = (window.innerHeight - 64) + "px";

	let svg;

	const size = m.size;
	const cols = [...Object.keys(m.parameters())].length;
	const n_options = Object.values(params).map( d => d.length ).reduce( (a, b) => a + b, 0 );

	$: h = size * cell.height;
	$: w1 = outVisWidth + margin.left; 
	$: w2 = (cell.width * n_options + cell.padding * (n_options - cols) + (cols + 1) * groupPadding);

	$: y = d3.scaleBand()
		.domain(d3.range(size))
		.range([margin.top, h - margin.bottom])
		.padding(0.15);

	$: x_grid = d3.scaleBand();

	// function resize() {
	// 	({ width, height } = svg.getBoundingClientRect());
	// 	console.log('resize()', width, height);
	// }

	onMount(() => {
		let t = "Fertilitylow"

		// filter and build the grid for the particular term
		let gridData = m.prepareGridData(t);

		const res_container = d3.select("div.vis").select("svg");
		const grid_container = d3.select("div.grid").select("svg");

		m.drawGrid(gridData, grid_container, x_grid, y, margin);
		m.drawResults(gridData, res_container, y);
	});
</script>

<style>
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-family: 'Avenir Next';
		font-size: 32px;
		font-weight: 300;
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
		<h1>Multiverse Visualisation</h1>
		<div style="margin: 40px 0"></div>
		<div class="vis" style="height: {windowHeight}">
			<svg bind:this={svg} height={h} width={w1}>
				<g class="outcomePanel"></g>
			</svg>
		</div>
		<div class="grid-container">
			<div class="grid" style="height: {windowHeight}">
				<svg bind:this={svg} height={h} width={w2}></svg>
			</div>
		</div>
	</div>
</main>