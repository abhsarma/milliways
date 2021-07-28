<div class="vis" id={"n"+id} style="height: {windowHeight}">
	<!-- <select bind:value={term} on:change={update}>
		{#each terms as t}
			<option value={t}>
				{t}
			</option>
		{/each}
	</select> -->
	<svg bind:this={svg} height={h} width={w1}></svg>
</div>

<script>
	import { outVisWidth, margin, cell, namingDim } from './dimensions.js';
	import * as d3 from 'd3';
	import Dropdown from './dropdown-menu.svelte';
	import * as dat from '../../static/data/data2.json';
	import { state } from './stores.js';
	import { onMount } from 'svelte';
	import { CDF } from './multiverseMatrix';
	
	// this is out of necessity, not really used in the <script>
	let svg;

	export let id;
	
	const data = dat.default;
	const terms = data[0]["results"].map(i => i["term"]); // not sure if should be const in the future tho

	let term = terms[0];
	let size = data.length;

	// this `let` variable is bound below; works similar to $:
	let outcomeData;

	$: windowHeight = (window.innerHeight - 64) + "px";
	$: h = "100%"
	$: w1 = outVisWidth + margin.left; 

	// previously was $:
	let yscale = d3.scaleBand()
		.domain(d3.range(size))
		.range([margin.top, h - (margin.bottom + namingDim + cell.height) ])
		.padding(0.1);


	// FUNCTIONS
	const prepareOutcomeData = () => {
		// in the future, implement CI graphs, not just CDF
		let temp = data.map(function(d) { 
			return Object.assign({}, ...d["results"].filter(i => i.term == term).map(
				i => Object.assign({}, ...["cdf.x", "cdf.y"].map((j) => ({[j]: i[j]})))
			))
		});

		outcomeData = temp.map((d, n) => d3.zip(d['cdf.x'], d['cdf.y'], d['cdf.y']))
		console.log(outcomeData);
	}

	const update = () => {
		prepareOutcomeData();
		CDF(outcomeData, d3.select("#n"+id), size, yscale);
	}


	onMount(() => {
		const menu = new Dropdown({ 
			target: d3.select("#n"+id).node(),
			props: {
				items: terms
			}
		});

		// update data when different option is selected using dropdown 
		menu.$on("message", event => {
			term = event.detail.text;
			update();
		})

		update();
	});
</script>

<style>
	svg {
		margin-left: 5px;
		margin-right: 0;
		background-color: #f7f7f7;
		/* display: inline-block; */
		float: left;
	}
	div.vis {
		/* display: inline-block; */
		float: left;
		overflow-y: auto;
	}
</style>