<script>
	import 'bootstrap-grid/dist/grid.min.css';
	import { onDestroy, onMount } from 'svelte';
	import * as d3 from 'd3';
	import * as data from '../static/data/data.json';
	import multiverseMatrix, {drawMatrixGrid, drawParameterNames, drawGridNames, drawColNames, drawOutcomes, drawSortByGroupsDivider} from './components/multiverseMatrix.js';
	import { windowHeight, cell, paramNameHeight, groupPadding, outVisWidth, margin, namingDim, iconSize, header1, scrollbarWidth, matrixGridBuffer, gridNamesHeight } from './components/dimensions.js'
	import ToggleSize from './components/toggle-gridSize.svelte'
	import {scrollTop} from './components/scrollTop.js'
	import Vis from './components/Vis.svelte';
	import { gridCollapse, exclude_options, join_options, groupParams, param_order_scale, option_order_scale } from './components/stores.js';
	import { colors } from './components/colorPallete.js';	
	import { arrayEqual, whichDiff, any } from './components/helpers/arrayMethods.js'
	import { drag_options, drag_parameters, dragSortDivider } from './components/drag.js';

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

	let param_n_options = Object.fromEntries(Object.entries(params).map( d => [d[0], d[1].length] ));
	
	const n_options = Object.values(param_n_options).reduce((a, b) => a + b, 0);

	let size = m.gridData.length;
	let y = d3.scaleBand()
			.domain(d3.range(size))
			.range([margin.top, h - (margin.bottom + namingDim + cell.height) ])
			.padding(0.1);

	$: if (gridCollapse_value) {cell.height = 1} else {cell.height = 24};
	$: size = m.gridData.length;
	$: h = size * cell.height + namingDim + margin.top + 4 * cell.padding;
	$: w1 = outVisWidth + margin.left; 
	$: w2 = (cell.width * n_options + cell.padding * (n_options - cols) + (cols + 1) * groupPadding);
	$: {
		y = d3.scaleBand()
			.domain(d3.range(size))
			.range([margin.top, h - (margin.bottom + namingDim + cell.height) ])
			.padding(0.1);
	}

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
	
	param_order_scale.set(x_scale_params);
	const colWidth = d3.max(Object.values(params).map(d => d.length)) * (cell.width + cell.padding);
	Object.keys(params).forEach(function(d, i) {
		let n = Object.values(params)[i].length;

		x_scale_options[d] = d3.scaleBand()
								.domain( d3.range(n) )
								.range( [0, n * (cell.width + cell.padding)] );
	})

	$: { update(m.outcomes, options_to_join, options_to_exclude, sortByGroupParams, gridCollapse_value); m=m; }

	onDestroy(() => { e_unsub(); j_unsub(); });

	onMount(() => {
		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params);
		drawGridNames(m.gridData, m.parameters(), y, x_scale_params);
		drawSortByGroupsDivider(params, x_scale_params, h);

		d3.selectAll(".option-headers").call(drag_options(options_to_join, x_scale_params, x_scale_options, order));
		d3.selectAll(".parameter").call(drag_parameters(x_scale_params, sortByGroupParams, param_n_options, y));
		d3.select("g.groupedSortDivider").call(dragSortDivider(x_scale_params, sortByGroupParams))

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
		// size = m.gridData.length; 

		drawMatrixGrid(m.gridData, m.parameters(), y, x_scale_params, gridState);

		drawOutcomes(outcomes, size, y, gridState); /// is this called? drawOutcomes takes 3 arguments

		if (gridState) {
			d3.selectAll("path.cdf").style("visibility", "hidden");
			d3.selectAll("rect.option-cell")
				.transition()
				.duration(500)
				.ease(d3.easeQuad)
				.attr("x", (cell.width - cell.width/4)/2)
				// .attr("y", (d, i) => y(i) + namingDim - (iconSize + cell.padding))
				.attr("width", cell.width/4)
				.attr("height", y.bandwidth())

		} else {
			d3.selectAll("path.cdf").style("visibility", "visible");
			d3.selectAll("rect.option-cell")
				.transition()
				.duration(500)
				.ease(d3.easeQuad)
				.attr("x", 0)
				// .attr("y", (d, i) => y(i) + namingDim - (iconSize + cell.padding))
				.attr("width", cell.width)
				.attr("height", y.bandwidth())
		}
	}

	function sortDirectionCallback(event){
		m.sortIndex = event.detail
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
					on:setSortIndex 	= {sortDirectionCallback}
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
