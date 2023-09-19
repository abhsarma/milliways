<script>
	import { css, cx } from '@emotion/css'
	import { range, extent, max, histogram } from 'd3-array';
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { area, line } from 'd3-shape';
	import { select } from 'd3-selection';
	import { brushX } from 'd3-brush';
	import { onMount, createEventDispatcher } from 'svelte';
	import { windowHeight, margin, cell, text, gridNamesHeight, scrollbarWidth, outcomeVisWidth, namingDim } from '../utils/dimensions.js'
	import { colors } from '../utils/colorPallete.js';
	import { mean } from '../utils/helpers/arrayMethods.js'
	import { gridCollapse, exclude_rows } from '../utils/stores.js'
	import Sort from './Sort.svelte'
	
	// svg is used to bind the svg HTML element in line 135
	let cellHeight, min = 32;

	const dispatch = createEventDispatcher();
	
	export let i;
	export let data;
	export let estimates;
	export let allOutcomeVars;
	export let sortAscending;
	export let sortByIndex;
	export let term = allOutcomeVars[0];

	let brushContainer, sx;

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
	$: xscale = scaleLinear()
		.domain(extent(data.density[0].map(d => d[0])))
		.range([margin.left, outcomeVisWidth]);

	// scale for position of g corresponding to each universe
	$: y = scaleBand()
		.domain(range(data.density.length))
		.range([margin.bottom, h - (margin.bottom + cell.padding) ])
		.padding(0.1);
	
	// scale for CDF of each universe
	$: yscale = scaleLinear()
		.domain([0, 0.5])
		.range([y.step() - cell.padding, 0]);

	$: areaGeom = area()
		.x(d => xscale(d[0]))
		.y0(d => yscale(d[1]))
		.y1(d => yscale(d[2]))

	$: lineGeom = line()
		.x(d => xscale(d[0]))
		.y(d => yscale(d[1]));

	// d's for axis paths
	$: xPath = `M${margin.left}, -6V0H${w - margin.right}V-6`;

	function brushed({selection}) {
		sx = selection.map(xscale.invert);
	}

	function brushEnd({selection}) {
		if (selection === null) {
			$exclude_rows = [];
			sx = xscale.domain();
		} else {
			$exclude_rows = [i, selection.map(xscale.invert)];
			sx = selection.map(xscale.invert);
		}
	}

	$: if (!sx) sx = xscale?.domain();

	onMount(() => {
		brushContainer = select(`#brush-container-${i}`);

		let brush = brushX()
			.on('start brush', brushed)
			.on('end', brushEnd)
			.extent([[margin.left, 2], [w - margin.right, yscaleHist.range()[1]]]);

		brushContainer.call(brush);
	})

	// histogram
	$: histGeom = histogram()
		.value( d => d)
		.domain(xscale.domain())  // domain of the graphic
		.thresholds(xscale.ticks(70)); // the numbers of bins

	$: bins = histGeom(estimates[i].flat());

	$: yscaleHist = scaleLinear()
		.domain([0, Math.round(data.mode / 10) * 10])
		.range([0, gridNamesHeight - (visButtonHeight + axisAdjust + 2)]); // 24 is for padding

	document.documentElement.style.setProperty('--bgColor', colors.background)
	document.documentElement.style.setProperty('--activeColor', colors.active)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
	document.documentElement.style.setProperty('--visColor', colors.vis)
	document.documentElement.style.setProperty('--grayColor', colors.gray70)
</script>

<div class="vis" id="vis-{i}">
	<div class={container}>
		<div class='vis-button-group'>
			<select class="vis-dropdown" id=vis-{i} bind:value={term} style="width: {w - 76 - scrollbarWidth}px;" on:change={() => dispatch("changeOutcomeVar")}>
				{#each allOutcomeVars as t}
					<option value={t}> {t} </option>
				{/each}
			</select>
			<Sort 
				i={i} 
				w={24}
				padding={6}
				bind:index={sortByIndex} 
				bind:order={sortAscending}
				on:setSortIndex = {(e) => {dispatch('setSortIndex', e.detail)} }
				on:changeSortDirection = {(e) => dispatch('changeSortDirection', e.detail)}
			/>
			<button class="close-button" id="vis-{i}" on:click={() => dispatch("remove")}>
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
					<line class="grid" y1="0" y2="{gridNamesHeight - visButtonHeight}" stroke="{colors.gray70}" stroke-opacity="0.2"/>
				</g>
			{/each}
		</g>

		<!-- brush is added onMount -->
		<g class="brush-container" id="brush-container-{i}" transform="translate(0, {axisAdjust})"></g>

		<!-- Histogram -->
		<g class="histogram-{i}" transform="translate(0, {axisAdjust})"> 
			{#each bins as d}
				<rect 
					class="d3-histogram" 
					x="{xscale(d.x0)}" 
					y = "{yscaleHist.range()[1] - yscaleHist(d.length)}"
					width="{xscale(d.x1) - xscale(d.x0)}" 
					height="{yscaleHist(d.length)}" 
					fill="{((d.x0+d.x1)/2 > sx[0]) && ((d.x0+d.x1)/2 < sx[1]) ? colors.vis : colors.inactive}"
					opacity=0.8></rect>
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
					<line class="grid" y1="0" y2="{h - (margin.bottom + cell.padding)}" stroke="{colors.gray70}" stroke-opacity="0.2"/>
				</g>
			{/each}
		</g>

		{#each data.density as universe, i}
			<g class="universe universe-{i}" transform="translate(0, {y(i)})">
				{#if !$gridCollapse}
					5e2c8 <path class="cdf" d={areaGeom(universe)} stroke="{colors.density}" fill="{colors.density}" stroke-width=1.5 opacity=0.8 />
					<path class="cdf" d={areaGeom(universe)} stroke="#EBDCC5" fill="#EBDCC5" stroke-width=1.5 opacity=1 />
				{/if}
				{#if (data.estimate[i].length === undefined)}
					<path class="median" 
						d={lineGeom([[Math.min(data.estimate[i]), 0.5], [Math.max(data.estimate[i]), 0.5]])}
						stroke="{colors.median}" stroke-width=2 />
					<circle fill="{colors.median}" stroke="{colors.median}" cx="{xscale(data.estimate[i])}" cy="{yscale(max(universe.map(d => d[2])))}" r="0.5"></circle>
				{:else}
					<path class="median" 
						d={lineGeom([[Math.min(...data.estimate[i]), 0.5], [Math.max(...data.estimate[i]), 0.5]])}
						stroke="{colors.median}" stroke-width=2 />
					<circle fill="{colors.median}" stroke="{colors.median}" cx="{xscale(mean(...data.estimate[i]))}" cy="{yscale(max(universe.map(d => d[2])))}" r="0.5"></circle>
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
		border-bottom-right-radius: 20px;
		border-bottom-left-radius: 20px;
	}

	svg.outcomeResults, g.universe {
		transition: all .5s linear;;
	}

	.vis-button-group {
		display: flex;
		position: absolute;
		flex-direction: row;
		align-content: center;
		margin: 4px 0px 0px 4px;
	}

	.vis-dropdown {
		position: sticky;
		top: 0;
		z-index: 1;
		flex:1;
		border: 1px solid var(--bgColor);
		padding: 0px;
	}

	.close-button {
		/* 34px is the height of the dropdown */
		position: sticky;
		top: 0;
		z-index: 2;
		width: 24px;
		height: 24px;
		padding: 6px;
		background-color: transparent !important;
		border: none;
		border-radius: 4px;
		box-sizing: content-box;
		align-content: center;
		cursor: pointer;
	}

	.close-button > svg {
		border-radius: 4px;
	}

	.close-button:hover > svg {
		background-color: var(--hoverColor);
		fill: white;
	}

	.close-button:active > svg {
		background-color: var(--hoverColor);
		fill: white;
	}

	.close-button:focus > svg {
		background-color: var(--hoverColor);
		fill: white;
	}

	.vis {
		display: inline-block;
		margin-left: 3px;
		border: 1px solid #efefef;
	}
	.vis:first-child {
		margin-left: 0;
	}

	select {
		height: 36px;
		border: none;
		background-color: var(--bgColor);
		text-align: center;
		font-family: 'Av-Nx', sans-serif;
		font-size: 14px;
	}

	text {
		font-family: 'Av-Nx', sans-serif;
		font-size: 12px;
	}
</style>