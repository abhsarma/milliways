<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data2.json';
	import multiverseMatrix, {drawMatrixGrid, drawGridNames, drawOutcomes } from './components/multiverseMatrix.js';
	import { cell, groupPadding, outVisWidth, margin, namingDim, iconSize, header1 } from './components/dimensions.js'
	import Toggle from './components/toggle-button.svelte'
	import {scrollTop} from './components/scrollTop.js'
	import Vis from './components/Vis.svelte';
	import { exclude_options, join_options, option_order_scale } from './components/stores.js';

	let options_to_exclude;
	let options_to_join;
	let x_scale_options;
	const oos_unsub = option_order_scale.subscribe(value => x_scale_options=value);
	const e_unsub =  exclude_options.subscribe(value => options_to_exclude=value);
	const j_unsub =  join_options.subscribe(value => options_to_join=value);

	let dragging = {};
	let target, trigger;

	let m = new multiverseMatrix(data.default); 
	m.initializeData();
	
	const params = m.parameters();

	let svg;
	// let vis = drawCDF;
	const windowHeight = (window.innerHeight - 170) + "px";
	// const size = m.size;
	const cols = [...Object.keys(m.parameters())].length;

	let order = {
		name: d3.range(cols).sort(function(a, b) { return a - b; })
  	};

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

	let x_scale_params = d3.scaleOrdinal()
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

	const colWidth = d3.max(Object.values(params).map(d => d.length)) * (cell.width + cell.padding);
	Object.keys(params).forEach(function(d, i) {
		x_scale_options[d] = d3.scaleBand()
								.domain( d3.range(d3.max(Object.values(params).map(d => d.length))) )
								.range( [0, colWidth] );
	})

	$: drawOutcomes(m.outcomes, m.size, y);
	$: update(options_to_join, options_to_exclude);

	onDestroy(() => { e_unsub(); j_unsub(); });

	onMount(() => {
		drawGridNames(m.gridData, m.parameters(), y, x_scale_params);
		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params);

		// console.log(x_scale_params(Object.keys(params)[1]), x_scale_params(Object.keys(params)[2]), x_scale_params(Object.keys(params)[3]))

		d3.selectAll(".option-value").call(drag);
		// drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params, x2)

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
		// call updateHandler
		m.updateHandler(join, exclude)
		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params);
		drawOutcomes(m.outcomes, m.size, y);
	}

	let drag = d3.drag()
		.subject(function(event, d) {
			return {x: x_scale_params(d[0].parameter) + x_scale_options[d[0].parameter](d[0].index)}
			// return {x: x(d[0].x)}; 
		})
		.on("start", function(event, d) {
			target = event.sourceEvent.target.tagName;
			if (target == "DIV") {
				trigger = event.sourceEvent.target.className.split(" ")[0];
				if (trigger == "option-label") {
					dragging[d[0].index] = x_scale_options[d[0].parameter](d[0].index);

					// print all the other joined options to the one that is being interacted with
					// console.log(d, options_to_join.map(d => d.options), options_to_join.map(d => d.parameter));
					console.log(dragging);

					// Move the column that is moving on the front
					let sel = d3.select(this);
					sel.moveToFront();
				}
			}
		})
		.on("drag", function(event, d) {
			if (trigger == "option-label" & target == "DIV") {
				dragging[d[0].index] = Math.min(
					x_scale_options[d[0].parameter].range()[1] + x_scale_options[d[0].parameter].bandwidth(),
					Math.max(-x_scale_options[d[0].parameter].bandwidth(), (event.x - x_scale_params(d[0].parameter)))
				);

				order.name.sort(function(a, b) { return cPosition(d[0].parameter, a) - cPosition(d[0].parameter, b); });
				// console.log(order.name)
				// order.name = [2, 0, 1, 3, 4];
				x_scale_options[d[0].parameter].domain(order.name);
				option_order_scale.update(v => v=x_scale_options);

				d3.selectAll(`g.option-value.${d[0].parameter}`).attr("transform", function(d, i) { 
					return "translate(" + cPosition(d[0].parameter, d[0].index) + ", 0)"; 
				});
			}
		})
		.on("end", function(event, d) {
			delete dragging[d[0].index];
			transition(d3.select(this)).attr("transform", "translate(" + x_scale_options[d[0].parameter](d[0].index) + ")");
		});

	d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
			this.parentNode.appendChild(this);
		});
	}

	function cPosition(p, d) {
	  	var v = dragging[d];
	  	return v == null ? x_scale_options[p](d) : v;
	}

	function transition(g) {
	  	return g.transition().duration(500);
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
