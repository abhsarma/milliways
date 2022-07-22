<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data.json';
	import multiverseMatrix, {drawMatrixGrid, drawParameterNames, drawGridNames, drawColNames, drawOutcomes, line, area, drawSortByGroupsDivider} from './components/multiverseMatrix.js';
	import { windowHeight, cell, paramNameHeight, groupPadding, outVisWidth, margin, namingDim, iconSize, header1, scrollbarWidth, matrixGridBuffer, gridNamesHeight } from './components/dimensions.js'
	import ToggleSize from './components/toggle-gridSize.svelte'
	import {scrollTop} from './components/scrollTop.js'
	import Vis from './components/Vis.svelte';
	import { gridCollapse, exclude_options, join_options, groupParams, param_order_scale, option_order_scale } from './components/stores.js';
	import { colors } from './components/colorPallete.js';	
	import { arrayEqual, whichDiff, any } from './components/helpers/arrayMethods.js'
	// import { optionDragStart, optionDragged, optionDragEnd } from './components/helpers/dragOptions.js'

	// Stores
	let options_to_exclude;
	let options_to_join;
	let x_scale_params;
	let x_scale_options;
	let sortByGroupParams;
	let gridCollapse_value;

	const gc_unsub = gridCollapse.subscribe(value => gridCollapse_value = value); // a store variable to control the size of the grid and corresponding outcome plot
	const e_unsub =  exclude_options.subscribe(value => options_to_exclude=value);
	const j_unsub =  join_options.subscribe(value => options_to_join=value);
	const pos_unsub = param_order_scale.subscribe(value => x_scale_params=value);
	const oos_unsub = option_order_scale.subscribe(value => x_scale_options=value);
	const gp_unsub = groupParams.subscribe(value => sortByGroupParams = value);

	let option_dragging = {}, previous_option_order = {}, parameter_dragging = {};
	let target, trigger;

	let m = new multiverseMatrix(data.default); 
	m.initializeData();
	
	const params = m.parameters();

	let svg;

	const cols = [...Object.keys(m.parameters())].length;

	let order = {};
  	Object.keys(params).forEach(function(d, i) {
  		let n = Object.values(params)[i].length;
		order[d] = { name: d3.range(n).sort(function(a, b) { return a - b; }) }
	});

	const param_n_options = Object.fromEntries(Object.entries(params).map( d => [d[0], d[1].length] ));
	const n_options = Object.values(param_n_options).reduce((a, b) => a + b, 0);

	// $: if (gridCollapse_value) {cell.height = 1} else {cell.height = 24};
	$: size = m.gridData.length; // not updating reactively
	$: h = size * cell.height + namingDim + margin.top + 4 * cell.padding;
	$: w1 = outVisWidth + margin.left; 
	$: w2 = (cell.width * n_options + cell.padding * (n_options - cols) + (cols + 1) * groupPadding);
	$: y = d3.scaleBand()
		.domain(d3.range(size))
		.range([0, h - (margin.bottom + namingDim + cell.height) ])
		.padding(0.1);

	x_scale_params = d3.scaleOrdinal()
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

	$: update(m.outcomes, options_to_join, options_to_exclude, sortByGroupParams, gridCollapse_value);

	onDestroy(() => { e_unsub(); j_unsub(); });

	onMount(() => {
		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params);
		drawGridNames(m.gridData, m.parameters(), y, x_scale_params);
		drawSortByGroupsDivider(params, x_scale_params, h);

		d3.selectAll(".option-headers").call(drag_options);
		d3.selectAll(".parameter").call(drag_parameters);
		d3.select("g.groupedSortDivider").call(dragSortDivider)

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

			d3.select("g.groupedSortDivider")
				.select("g.groupedSortDividerIcon")
				.attr("transform", `translate(0, ${this.scrollTop + (windowHeight + gridNamesHeight - (iconSize * 4/3))/2 })`);
		}
	});

	function update(outcomes, join, exclude, sortByGroupParams, gridState) {
		// call updateHandler
		m.updateHandler(join, exclude); //m = m;
		size = m.gridData.length;

		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params, gridState);

		let zy;
		if (gridState) {
			d3.selectAll("path.cdf").style("visibility", "hidden");
			zy = setZoom(0.1)

		} else {
			d3.selectAll("path.cdf").style("visibility", "visible");
			zy = reset(1)
		}

		drawOutcomes(outcomes, size, zy, gridState);
	}

	/**
	// defines semantic zoom operation when views are 
	// toggled between overview and distribution
	**/
	function zoomed(event) {
		y.range([0, h - (margin.bottom + namingDim + cell.height)].map(d => event.transform.applyY(d)));

		d3.selectAll("g.parameter-col")
			.selectAll("g.option-value")
			.selectAll("rect.option-cell")
			.attr("y", (d, i) => y(i))
			.attr("height", y.bandwidth())

		d3.selectAll("g.outcomePanel")
			.selectAll("g.universe")
			.attr("transform", (d, i) => `translate(0, ${y(i)})`)
	}

	let zoom = d3.zoom()
		.scaleExtent([1, 10])
		.interpolate(d3.interpolate)
		.on("zoom", zoomed);

	function setZoom(k) {
		const tx = 0;
		const ty = 0;

		d3.select("svg.grid-body")
			.transition()
			.duration(750)
			.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));

		d3.selectAll("rect.option-cell")
			.attr("x", (cell.width - cell.width/4)/2)
			.attr("width", cell.width/4)

		// new y-scale
		let zy = y.copy();
		zy.range([0, h - (margin.bottom + namingDim + cell.height)].map(d => d3.zoomIdentity.translate(tx, ty).scale(k).applyY(d)));
		return zy;
	}

	function reset(k) {
		d3.select("svg.grid-body")
			.transition()
			.duration(750)
			.call(zoom.transform, d3.zoomIdentity);

		d3.selectAll("rect.option-cell")
			.attr("x", 0)
			.attr("width", cell.width)

		// new y-scale
		let zy = y.copy();
		zy.range([0, h - (margin.bottom + namingDim + cell.height)].map(d => d3.zoomIdentity.applyY(d)))
		return zy;
	}


	function sortDirecitonCallback(event){
		m.sortIndex = event.detail
	}

	d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
			this.parentNode.appendChild(this);
		});
	}

	function transition(g) {
		return g.transition().duration(500);
	}

	/**
	// defines drag interaction to re-order 
	//  options within each parameter
	**/
	let drag_options = d3.drag()
		.subject(function(event, d) {
			return {x: x_scale_params(d[0].parameter) + x_scale_options[d[0].parameter](d[0].index)}
		})
		.on("start", function(event, d) {
			target = event.sourceEvent.target.tagName;
			previous_option_order[d[0].index] = x_scale_options[d[0].parameter].domain();

			if (target == "DIV") {
				trigger = event.sourceEvent.target.className.split(" ")[0];
				if (trigger == "option-label") {
					option_dragging[d[0].index] = x_scale_options[d[0].parameter](d[0].index);

					// Move the column that is moving on the front
					d3.select(this).moveToFront();
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
				option_order_scale.update(v => v = x_scale_options);
				
				d3.selectAll(`g.option-value.${d[0].parameter}, g.option-headers.${d[0].parameter}`)
					.attr("transform", (d, i) => `translate(${cPosition(d[0].parameter, d[0].index)}, 0)`);
			}
		})
		.on("end", function(event, d) {
			// step 1: check if the order of the options (within the current parameter) has changed at all
			// if (!arrayEqual(previous_option_order[d[0].index], order[d[0].parameter].name)) { 
			let current_param_joined = options_to_join
										.filter(x => (x.parameter == d[0].parameter))
										.map(d => d.indices).flat();

			// step 1: which option indices have changed?
			let diff_indices = whichDiff(previous_option_order[d[0].index], order[d[0].parameter].name);

			// step 2: un-join...by updating options_to_join and the store
			options_to_join = options_to_join.filter(x => 
				!((x.parameter == d[0].parameter) && // step 2.1 check if indices are correspond to the parameter being interacted with
					any(...diff_indices.map(v => x.indices.includes(v)))) // step 2.2 if yes, remove the indices which differ in position
			);
			join_options.update(arr => arr = options_to_join);
			
			delete option_dragging[d[0].index];
			transition(d3.select(this))
				.attr("transform", `translate(${x_scale_options[d[0].parameter](d[0].index)}, 0)`);
			transition(d3.select(`g.option-value.${d[0].parameter}.${d[0].option}`))
				.attr("transform", `translate(${x_scale_options[d[0].parameter](d[0].index)}, 0)`);
		});

	// option positions
	function cPosition(p, d) {
		var v = option_dragging[d];
		return v == null ? x_scale_options[p](d) : v;
	}

	/**
	// defines drag interaction to re-order 
	// parameters (while keeping options in the same order)
	**/
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
				param_order_scale.update(v => v = x_scale_params);

				
				d3.selectAll(`g.parameter`).select('foreignObject')
					.attr("x", d => pPosition(d));
				d3.select("svg.grid-headers").selectAll(`g.parameter-col`)
					.attr("transform", d => `translate(${pPosition(d)}, ${margin.top})`);
				d3.select("svg.grid-body").selectAll(`g.parameter-col`)
					.attr("transform", d => `translate(${pPosition(d)}, ${gridNamesHeight})`);
			}
		})
		.on("end", function(event, d) {
			delete parameter_dragging[d];

			let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
			let dividerPositionIndex = d3.select("g.groupedSortDivider").attr("class").split(" ")[1]

			d3.select("g.groupedSortDivider")
				.transition()
				.attr("transform", `translate(${boundaries[dividerPositionIndex]}, 0)`)
				// .attr("transform", boundaries[dividerPositionIndex])

			sortByGroupParams = x_scale_params.domain().slice(dividerPositionIndex).reverse()
			groupParams.update(arr => arr = sortByGroupParams)

			transition(d3.select(`g.parameter-col.${d}`).attr("transform", `translate(${x_scale_params(d)}, ${margin.top})`));
			transition(d3.select(this).select('foreignObject').attr("x", x_scale_params(d)));
		});

	// parameter positions
	function pPosition(d) {
	  	var v = parameter_dragging[d];
	  	return v == null ? x_scale_params(d) : v;
	}

	/**
	// defines drag interaction for the groupedSortDivider
	// which defines input to the groupedSortFunction
	**/
	let dragSortDivider = d3.drag()
		// .subject(function(event, d) {} )
		.on("start", dividerDragStarted)
		.on("drag", dividerDragged)
		.on("end", dividerDragEnded)


	function findClosestDivision(x_value) {
		let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
		var nearest = boundaries.reduce(function(prev, curr) {
			return (Math.abs(curr - x_value) < Math.abs(prev - x_value) ? curr : prev);
	  });
	  return nearest
	}

	function dividerDragStarted(event, d) { return null }
	
	function dividerDragged(event, d) {
		let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
		let minBarPosition = boundaries[0];
		let maxBarPosition = boundaries[boundaries.length - 1];

		if (event.x > minBarPosition && event.x < maxBarPosition) {
			d3.select(this).raise().attr("transform", `translate(${event.x}, 0)`);
			d3.select(this).raise().attr("transform", `translate(${event.x}, 0)`);
		}
	}

	function dividerDragEnded(event, d) {
		let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
		let nearestDivision = findClosestDivision(event.x);
		let dividerPositionIndex = boundaries.indexOf(nearestDivision);

		d3.select(this)
			.attr("class", `groupedSortDivider ${dividerPositionIndex}`)
			.transition()
			.attr("transform", `translate(${nearestDivision}, 0)` )
			.attr("transform", `translate(${nearestDivision}, 0)` )

		sortByGroupParams = x_scale_params.domain().slice(dividerPositionIndex).reverse()
		groupParams.update(arr => arr = sortByGroupParams)
	}
	
	function dividerClicked(event, d){
		if (event.defaultPrevented) return; // dragged
	}

	// defining color variables for use in CSS
	document.documentElement.style.setProperty('--white', colors.white)
	document.documentElement.style.setProperty('--activeColor', colors.active)
	document.documentElement.style.setProperty('--bgColor', colors.background)
	document.documentElement.style.setProperty('--grayColor', colors.gray)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<style>
	main {
		white-space: nowrap;
	}

	h1 {
		color: var(--activeColor) !important;
		text-transform: uppercase;
		font-family: 'Avenir Next';
		font-size: 32px;
		font-weight: 300;
		display: inline-block;
	}

	svg.grid-headers {
		background-color: var(--bgColor) !important;
		display: inline-block;
		float: left;
		position: absolute;
		/*box-shadow: 0px 4px 5px -2px #c0c0c0;*/
	}

	svg.grid-body {
		background-color: var(--bgColor) !important;
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
	<div class = "container-flex">
		<div class="row">
			<div class="col-sm-7">
				<h1 style="margin: {header1.top}px 72px">Multiverse Visualisation</h1>
			</div>
			<div class="col-sm-3">
				<ToggleSize/>
			</div>
		</div>
	</div>
	<div class="button-wrapper">
		<button on:click={() => { m.initializeOutcomeData(options_to_join, options_to_exclude); m=m; }}>
			<svg class="add-vis-icon" xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 0 24 24" width="32px" fill="{colors.active}"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
		</button>
	</div>
	<div class="main-content">
		<div class="vis-container" style="height: {windowHeight}px;">
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
					on:changeSortDirection = {() => { m.sortAscending = !m.sortAscending }}
					on:remove			= {() => { m.outcomes.splice(i,1); m = m; }}
				/>
			{/each}
		</div>
		<div class="grid-container">
			<!-- <div class="grid" clientHeight={windowHeight}> -->
			<div class="grid" style="height: {windowHeight}px">
				<svg class="grid-headers" height={gridNamesHeight} width={w2}></svg>
				<svg class="grid-body" bind:this={svg} height={h} width={w2 + matrixGridBuffer}></svg>
			</div>
		</div>
	</div>
</main>
