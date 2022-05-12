<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data2.json';
	import multiverseMatrix, {drawMatrixGrid, drawGridNames, drawOutcomes } from './components/multiverseMatrix.js';
	import { cell, groupPadding, outVisWidth, margin, namingDim, iconSize, header1 } from './components/dimensions.js'
	import Toggle from './components/toggle-names-button.svelte'
	import {scrollTop} from './components/scrollTop.js'
	import Vis from './components/Vis.svelte';
	import { exclude_options, join_options, option_order_scale } from './components/stores.js';

	let options_to_exclude;
	let options_to_join;
	let x_scale_options;
	const oos_unsub = option_order_scale.subscribe(value => x_scale_options=value);
	const e_unsub =  exclude_options.subscribe(value => options_to_exclude=value);
	const j_unsub =  join_options.subscribe(value => options_to_join=value);

	let option_dragging = {}, parameter_dragging = {};
	let target, trigger;

	let m = new multiverseMatrix(data.default); 
	m.initializeData();
	
	const params = m.parameters();

	let svg;
	const windowHeight = (window.innerHeight - 170) + "px";
	// const size = m.size;
	const cols = [...Object.keys(m.parameters())].length;

	let order = {};
  	Object.keys(params).forEach(function(d, i) {
  		let n = Object.values(params)[i].length;
		order[d] = { name: d3.range(n).sort(function(a, b) { return a - b; }) }
	});

	const param_n_options = Object.fromEntries(Object.entries(params).map( d => [d[0], d[1].length] ));

	const n_options = Object.values(param_n_options).reduce((a, b) => a + b, 0);

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
			Object.values(param_n_options)
				.reduce( (acc, val, index) => {
					if (index == 0) {
						acc.push(0);
						acc.push(val); // acc.push([val[0], val[1]]);
					} else {
						acc.push(val + acc[acc.length - 1]); // acc.push([val[0], val[1] + acc[acc.length - 1][1]]);
					}
					return acc; 
				}, [] )
				.reduce((a, v, i, arr) => {
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
		let n = Object.values(params)[i].length;

		x_scale_options[d] = d3.scaleBand()
								.domain( d3.range(n) )
								.range( [0, n * (cell.width + cell.padding)] );
	})

	$: update(m.outcomes, m.size, y, options_to_join, options_to_exclude);

	onDestroy(() => { e_unsub(); j_unsub(); });

	onMount(() => {
		drawGridNames(m.gridData, m.parameters(), y, x_scale_params);

		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params);

		d3.selectAll(".option-value").call(drag_options);

		d3.selectAll(".parameter").call(drag_parameters);
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

		// d3.select("foreignObject.option-join.mc_option1").select("button").node().click() // use this to toggle states
	});

	function update(outcomes, size, y, join, exclude) {
		// call updateHandler
		m.updateHandler(join, exclude)

		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params);

		drawOutcomes(outcomes, size, y);
	}

	function sortDirecitonCallback(event){
		m.sortIndex = event.detail
	}

	let drag_options = d3.drag()
		.subject(function(event, d) {
			return {x: x_scale_params(d[0].parameter) + x_scale_options[d[0].parameter](d[0].index)}
		})
		.on("start", function(event, d) {
			target = event.sourceEvent.target.tagName;

			if (target == "DIV") {
				trigger = event.sourceEvent.target.className.split(" ")[0];
				if (trigger == "option-label") {
					option_dragging[d[0].index] = x_scale_options[d[0].parameter](d[0].index);

					// Move the column that is moving on the front
					let sel = d3.select(this);
					sel.moveToFront();
				}
			}
		})
		.on("drag", function(event, d) {
			if (trigger == "option-label" & target == "DIV") {
				option_dragging[d[0].index] = Math.min(
					x_scale_options[d[0].parameter].range()[1],
					Math.max(-x_scale_options[d[0].parameter].bandwidth(), (event.x - x_scale_params(d[0].parameter)))
				);

				order[d[0].parameter].name.sort(function(a, b) { return cPosition(d[0].parameter, a) - cPosition(d[0].parameter, b); });
				x_scale_options[d[0].parameter].domain(order[d[0].parameter].name);
				option_order_scale.update(v => v=x_scale_options);

				d3.selectAll(`g.option-value.${d[0].parameter}`).attr("transform", function(d, i) { 
					return "translate(" + cPosition(d[0].parameter, d[0].index) + ", 0)"; 
				});
			}
		})
		.on("end", function(event, d) {
			// gives whether any options for the current parameter (parameter within which dragging interaction is taking place)
			// are "joined"
			let current_param_joined = options_to_join
											.filter(x => (x.parameter == d[0].parameter))
											.map(d => d.options);

			if (current_param_joined.length) {
				options_to_join = options_to_join.filter( i => !i['options'].includes(d[0].option) );
				join_options.update(arr => arr = options_to_join);
			}

			delete option_dragging[d[0].index];
			transition(d3.select(this)).attr("transform", "translate(" + x_scale_options[d[0].parameter](d[0].index) + ")");
		});

	let drag_parameters = d3.drag()
		.subject(function(event, d) {
			return {x: x_scale_params(d)}
		})
		.on("start", function(event, d) {
			target = event.sourceEvent.target.tagName;

			if (target == "DIV") {
				trigger = event.sourceEvent.target.className.split(" ")[1];

				if (trigger == "parameter-name") {
					parameter_dragging[d] = x_scale_params(d);

					// Move the column that is moving on the front
					let sel = d3.select(this);
					sel.moveToFront();
				}
			}
		})
		.on("drag", function(event, d) {
			if (trigger == "parameter-name" & target == "DIV") {
				parameter_dragging[d] = Math.max(
					x_scale_params.range()[0] - 24,
					Math.min(event.x, x_scale_params.range()[x_scale_params.range().length - 2] + 24)
				);

				let parameter_order = Object.entries(param_n_options).sort(function(a, b) { 
					return pPosition(a[0]) - pPosition(b[0]); 
				});
				let param_order_range = parameter_order.map(d => d[1])
					.reduce( (acc, val, index) => {
						if (index == 0) {
							acc.push(0);
							acc.push(val); // acc.push([val[0], val[1]]);
						} else {
							acc.push(val + acc[acc.length - 1]); // acc.push([val[0], val[1] + acc[acc.length - 1][1]]);
						}
						return acc; 
					}, [] )
					.reduce((a, v, i, arr) => {
						if (i > 0) {
							let opts = (arr[i] - arr[i - 1])
							a.push(opts * cell.width + (opts - 1) * cell.padding + groupPadding + a[i - 1])
						} else {
							a.push(groupPadding)
						}
						return a;
					}, []);

				x_scale_params.domain(parameter_order.map(d => d[0]));
				x_scale_params.range(param_order_range);
				
				d3.selectAll(`g.parameter`).select('foreignObject')
					.attr("x", d => pPosition(d));
				d3.selectAll(`g.parameter-col`)
					.attr("transform", d => `translate(${pPosition(d)}, ${y(0)})`);
			}
		})
		.on("end", function(event, d) {
			delete parameter_dragging[d];
			transition(d3.select(`g.parameter-col.${d}`).attr("transform", `translate(${x_scale_params(d)}, ${y(0)})`));
			transition(d3.select(this).select('foreignObject').attr("x", x_scale_params(d)));
		});

	d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
			this.parentNode.appendChild(this);
		});
	}

	function cPosition(p, d) {
	  	var v = option_dragging[d];
	  	return v == null ? x_scale_options[p](d) : v;
	}

	function pPosition(d) {
	  	var v = parameter_dragging[d];
	  	return v == null ? x_scale_params(d) : v;
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

<main>
	<div id="leftDiv"></div>
	<div class = "container">
		<div class="row">
			<div class="col-sm-8">
				<h1 style="margin: {header1.top}px 0px">Multiverse Visualisation</h1>
			</div>
			<!-- div class="col-sm-3">
				<Toggle/>
			</div> -->
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
					i              		= {i}
					allOutcomeVars 		= {m.allOutcomeVars}
					bind:w         		= {w1}
					bind:h         		= {h}
					bind:term      		= {outcome.var}
					bind:sortIndex 		= {m.sortIndex}
					bind:sortAscending 	= {m.sortAscending}
					on:change	   		= {() =>  { m.updateOutcomeData(i, outcome.var, options_to_join, options_to_exclude); m = m; }}
					on:setSortIndex 	= {sortDirecitonCallback}
					on:changeSortDirection = {() => {m.sortAscending = !m.sortAscending}}
					on:remove			= {(m.outcomes.splice(i,1))}
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
