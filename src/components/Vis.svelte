<script>
	import { css, cx } from '@emotion/css'
	import * as d3 from 'd3';
	import { onMount, createEventDispatcher } from 'svelte';
	import { windowHeight, margin, cell, text, gridNamesHeight, scrollbarWidth, outcomeVisWidth, namingDim } from '../utils/dimensions.js'
	import { colors } from '../utils/colorPallete.js';
	import { mean } from '../utils/helpers/arrayMethods.js'
	import { gridCollapse, exclude_rows } from '../utils/stores.js'
	
	// svg is used to bind the svg HTML element in line 135
	let cellHeight, min = 32;

	const dispatch = createEventDispatcher();
	
	export let i;
	export let data;
	export let allOutcomeVars;
	export let sortAscending;
	export let sortByIndex;
	export let term = allOutcomeVars[0];

	let visButtonHeight = 44;

	// the axis is anchored at the Top as opposed to the more commonly used axisBottom
	// takes into account size of tick + font (24px) and padding (2 * 8px)
	let axisAdjust = 24 + 2*8;
	
	// CSS Styles
	$: container = css`
		height: ${visButtonHeight}px; // height of buttons (44) + ...
		width: ${w}px;
		displaY: flex;
		position: sticky;
		top: 0px;
		background-color: ${colors.background};
	`;

	$: outcomeAxis = css`
		background-color: ${colors.background} !important;
		display: flex;
		position: sticky;
		top: ${visButtonHeight}px;
		pointer-events: none;
	`;

	$: cellHeight = $gridCollapse ? 2 : cell.height
	$: w = outcomeVisWidth + margin.left;
	$: h = cell.padding + data.density.length * cellHeight + 2*margin.bottom;

	// scales
	$: xscale = d3.scaleLinear()
		.domain(d3.extent(data.density[0].map(d => d[0])))
		.range([margin.left, outcomeVisWidth]);

	// scale for position of g corresponding to each universe
	$: y = d3.scaleBand()
		.domain(d3.range(data.density.length))
		.range([margin.bottom, h - (margin.bottom + cell.padding) ])
		.padding(0.1);
	
	// scale for CDF of each universe
	$: yscale = d3.scaleLinear()
		.domain([0, 0.5])
		.range([y.step() - cell.padding, 0]);

	$: area = d3.area()
		.x(d => xscale(d[0]))
		.y0(d => yscale(d[1]))
		.y1(d => yscale(d[2]))

	$: line = d3.line()
		.x(d => xscale(d[0]))
		.y(d => yscale(d[1]));

	// d's for axis paths
	$: xPath = `M${margin.left}, -6V0H${w - margin.right}V-6`;

	function brushStart(e) {
		// $exclude_rows = []; // this will not exclude anything
		dispatch("brush");
	}

	function brushEnd(e) {
		try {
			let [p1,p2] = e.selection;
			$exclude_rows = [i, [xscale.invert(p1), xscale.invert(p2)]];
		}
		catch (err) { // happens when the user clicks outside of selection rect without dragging
			$exclude_rows = []; // this will not exclude anything
		}
	}

	onMount(() => {
		let brushContainer = d3.select(`#brush-container-${i}`);

		let brush = d3
			.brushX()
			.on('start', brushStart)
			.on('end', brushEnd)
			.extent([[margin.left, 2], [w - margin.right, yscaleHist.range()[1]]]);

		brushContainer.call(brush);
	})

	// histogram
	$: histogram = d3.histogram()
		.value(function(d) { return d; })   // I need to give the vector of value
		.domain(xscale.domain())  // then the domain of the graphic
		.thresholds(xscale.ticks(70)); // then the numbers of bins

	$: bins = histogram(data.estimate.flat());

	$: yscaleHist = d3.scaleLinear()
		.domain([0, Math.round(data.mode / 10) * 10])
		.range([0, gridNamesHeight - (visButtonHeight + axisAdjust + 2)]); // 24 is for padding

	document.documentElement.style.setProperty('--bgColor', colors.background)
	document.documentElement.style.setProperty('--activeColor', colors.active)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
	document.documentElement.style.setProperty('--visColor', colors.vis)
</script>

<div class="vis" id="vis-{i}">
	<div class={container}>
		<div class='vis-button-group'>
			<select class="vis-dropdown" id=vis-{i} bind:value={term} style="width: {w - 76 - scrollbarWidth}px;" on:change={() => dispatch("changeOutcomeVar")}>
				{#each allOutcomeVars as t}
					<option value={t}> {t} </option>
				{/each}
			</select>
			{#if sortByIndex == i}
				{#if sortAscending}
					<button class="vis-button sort-btn" id="vis-{i}" on:click={()=> dispatch("changeSortDirection")}>
						<svg class="active_svg" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>
					</button>
				{:else}
					<button class="vis-button sort-btn" id="vis-{i}" on:click={()=> {dispatch("changeSortDirection"); dispatch("setSortIndex", -1)}}>
						<svg class="active_svg" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>					
					</button>
				{/if}
			{:else}
				<button class="vis-button sort-btn" id="vis-{i}" on:click={() => dispatch("setSortIndex", i)}>
					<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/></svg>
				</button>
			{/if}
			<button class="vis-button close-btn" id="vis-{i}" on:click={() => dispatch("remove")}>
				<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
			</button>
		</div>
	</div>

	<svg class="{outcomeAxis} vis-{i}" height="{gridNamesHeight - visButtonHeight}" width={w}>
		<!-- Axes -->
		<g id="axis-{i}" transform="translate(0, {axisAdjust})">
			<!-- x axis -->
			<path class="domain"  stroke="currentColor" d="{xPath}" fill="none" />
			{#each xscale.ticks(5) as tick}
				<g class="tick" transform="translate({xscale(tick)}, 0)">
					<line class="tick" y2="-6" stroke="black"/>
					<text text-anchor="middle" dy="0em" y="{-text}" style="font-size: {text}">{tick}</text>
				</g>
			{/each}
		</g>

		<!-- Grid Lines -->
		<g transform="translate(0, {axisAdjust})">
			<!-- grid lines -->
			{#each xscale.ticks(5) as tick}
				<g class="tick" transform="translate({xscale(tick)}, 0)">
					<line class="grid" y1="0" y2="{gridNamesHeight - visButtonHeight}" stroke="black" stroke-opacity="0.2"/>
					}
				</g>
			{/each}
		</g>

		<!-- brush is added onMount -->
		<g class="brush-container" id="brush-container-{i}" transform="translate(0, {axisAdjust})"></g>

		<!-- Histogram -->
		<g class="histogram-{i}" transform="translate(0, {axisAdjust})"> 
			<!-- {axisAdjust + 8} -->
			{#each bins as d}
				<!-- y={yscaleHist.range()[1] - yscaleHist(d.length) + 4} // 4 is for padding -->
				<rect 
					class="d3-histogram" 
					x="{xscale(d.x0)}" 
					y = "{yscaleHist.range()[1] - yscaleHist(d.length)}"
					width="{xscale(d.x1) - xscale(d.x0)}" 
					height="{yscaleHist(d.length)}" 
					fill="{colors.vis}"
					opacity=0.8></rect>
				}
			{/each}
			<line class="histogram-xgrid-major" 
				x1="{xscale.range()[0]}" x2="{xscale.range()[1]}" y1="{yscaleHist.range()[1]}" y2="{yscaleHist.range()[1]}"
				stroke="black" stroke-opacity="0.2" stroke-width="2" />
		</g>

		<!-- zero-line -->
		<line class="intercept" 
			x1="{xscale(0)}" x2="{xscale(0)}" y1="{axisAdjust}" y2="{windowHeight}"
			stroke={colors.gray80} stroke-width="2" />
	</svg>


	<svg class="outcomeResults vis-{i}" height={h} width={w}>
		<!-- Grid Lines -->
		<g>
			<!-- grid lines -->
			{#each xscale.ticks(5) as tick}
				<g class="tick" transform="translate({xscale(tick)}, 0)">
					<line class="grid" y1="0" y2="{h - (margin.bottom + cell.padding)}" stroke="black" stroke-opacity="0.2"/>
				</g>
			{/each}
		</g>

		{#each data.density as universe, i}
			<g class="universe universe-{i}" transform="translate(0, {y(i)})">
				{#if !$gridCollapse}
					<path class="cdf" d={area(universe)} stroke="{colors.vis}" fill="{colors.vis}" stroke-width=1.5 opacity=0.8 />
				{/if}
				{#if (data.estimate[i].length === undefined)}
					<path class="median" 
						d={line([[Math.min(data.estimate[i]), 0.5], [Math.max(data.estimate[i]), 0.5]])}
						stroke="{colors.median}" stroke-width=2 />
					<circle fill="{colors.median}" stroke="{colors.median}" cx="{xscale(data.estimate[i])}" cy="{yscale(0.5)}" r="0.5"></circle>
				{:else}
					<path class="median" 
						d={line([[Math.min(...data.estimate[i]), 0.5], [Math.max(...data.estimate[i]), 0.5]])}
						stroke="{colors.median}" stroke-width=2 />
					<circle fill="{colors.median}" stroke="{colors.median}" cx="{xscale(mean(...data.estimate[i]))}" cy="{yscale(0.5)}" r="0.5"></circle>
				{/if}
			</g>
		{/each}

		<!-- zero-line -->
		<line class="intercept" 
			x1="{xscale(0)}" x2="{xscale(0)}" y1="0" y2="{h - (margin.bottom + cell.padding)}"
			stroke={colors.gray80} stroke-width="2" />
	</svg>
</div>

<style>
	svg.outcomeResults {
		background-color: var(--bgColor);
		float: left;
		display: inline-block;
		scrollbar-width: none;  /* Firefox */
	}

	svg.outcomeResults, g.universe {
		transition: all .5s linear;;
	}

	.vis-button-group {
		display: flex;
		position: absolute;
		flex-direction: row;
		align-content: center;
	}

	.vis-dropdown {
		position: sticky;
		top: 0;
		z-index: 1;
		flex:1;
		border: 1px solid var(--bgColor);
	}

	.vis-dropdown {
		padding: 0px;
	}

	.vis-button {
		/* 34px is the height of the dropdown */
		position: sticky;
		top: 0;
		z-index: 2;
		width: 36px;
		height: 36px;
		padding: 0px;
		border: 1px solid var(--bgColor);
		background-color: var(--bgColor);
		border-radius: 4px;
		flex:1;
		align-content: center;
	}

	.vis-button:hover > svg {
		background-color: var(--hoverColor);
		fill: white;
	}
	.vis-button:active > svg {
		background-color: var(--hoverColor);
		color: white;
	}
	.vis {
		display: inline-block;
		margin-left: 3px;
	}
	.vis:first-child {
		margin-left: 0;
	}
	
	.active_svg {
		background-color: var(--hoverColor);
		fill: white;
	}

	select {
		height: 36px;
		border: none;
		background-color: var(--bgColor);
		text-align: center;
	}
</style>