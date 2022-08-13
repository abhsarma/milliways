<script>
	import { css, cx } from '@emotion/css'
	import * as d3 from 'd3';
	import { onMount, createEventDispatcher } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import { windowHeight, margin, cell, groupPadding, gridNamesHeight, header, iconSize, namingDim, nameContainer } from '../utils/dimensions.js'
	import SortByGroupDivider from './sortByGroupDivider.svelte';
	import OptionToggle from './toggle-hide-option.svelte'
	import OptionJoin from './toggle-join-option.svelte'
	import { gridCollapse, exclude_options, join_options, parameter_scale, option_scale } from '../utils/stores.js'
	import { drag_options, drag_parameters, dragSortDivider } from '../utils/drag.js';

	export let data;
	export let parameters;

	// CSS Styles
	export const parameter_name = css`
		font-size: ${header.size + "px"};
		font-family: 'Avenir Next';
		text-transform: uppercase;
		padding: 0px ${cell.padding/2 + "px"};
		background-color: ${colors.background};
		cursor: default;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
		width: 100%;
		user-select: none;
	`;

	export const option_names = css`
		font-size: ${header.size + "px"};
		font-family: 'Avenir Next';
		line-height: ${cell.width}px;
		overflow: hidden;
		text-overflow: ellipsis;
		cursor: default;
		height: ${nameContainer.height}px;
		width: ${nameContainer.width}px;
		writing-mode: tb-rl; 
		transform: rotate(-180deg);
	`;

	export const options_container = css`
		fill: ${colors.inactive};
	`;

	export const selected_option = css`
		fill: ${colors.active};
	`;

	let cellHeight, cellWidth;

	const param_n_options = Object.fromEntries(Object.entries(parameters).map( d => [d[0], d[1].length] ));
	const n_options = Object.values(param_n_options).reduce((a, b) => a + b, 0);
	const cols = [...Object.keys(parameters)].length;
	const x2 = d3.scaleBand()
				.domain( d3.range(d3.max(Object.values(param_n_options))) )
				.range( [0, d3.max(Object.values(param_n_options)) * (cell.width + cell.padding)] );

	$: { cellHeight = $gridCollapse ? 2 : cell.height }
	$: { cellWidth = $gridCollapse ? 8 : cell.width }
	$: w = (cell.width * n_options + cell.padding * (n_options - cols) + (cols + 1) * groupPadding);
	$: h = gridNamesHeight + cell.padding + data.length * cellHeight + margin.bottom;
	$: y = d3.scaleBand()
		.domain(d3.range(data.length))
		.range([0, h - (margin.bottom + gridNamesHeight + cell.padding) ])
		.padding(0.1);

	document.documentElement.style.setProperty('--bgColor', colors.background)

	let order = {};

  	Object.keys(parameters).forEach(function(d, i) {
  		let n = Object.values(parameters)[i].length;
		order[d] = { name: d3.range(n).sort(function(a, b) { return a - b; }) }
	});

	onMount(() => {
		d3.selectAll(".option-headers").call(drag_options(order));
		d3.selectAll(".parameter").call(drag_parameters(param_n_options, y));
		d3.select("g.grouped-sort-divider").call(dragSortDivider())
	})

	let mvWindow;
	const bc = new BroadcastChannel('mv');
	function openFile() {
		let spec = structuredClone(data[this.getAttribute("row")]);
		Object.keys(spec).forEach(param => spec[param] = spec[param][0]);

		if (!mvWindow || mvWindow.closed) {
			mvWindow = open("example-analysis-4.html", "example-analysis-4.html", "height=540,width=960");

			let script = document.createElement('script');
			
			let scriptContent = `
				const bc = new BroadcastChannel('mv');
				bc.onmessage = e => setActiveSpecification(e.data);
				let poll = setInterval(()=>{
					if (typeof setActiveSpecification !== 'undefined') {
						setActiveSpecification(${JSON.stringify(spec)});
						clearInterval(poll);
					}
				},100);
			`;
			script.innerHTML = scriptContent;
			mvWindow.document.body.appendChild(script);
		} 
		else {
			bc.postMessage(spec);
		}
	}
</script>

<div class="grid">
	<svg class="grid-header" height={gridNamesHeight} width={w}>
		{#each Object.keys(parameters) as parameter}
			<g class="parameter {parameter}">
				<foreignObject 
					x="{$parameter_scale(parameter)}" 
					y="{cell.padding}" 
					width="{(cell.width + cell.padding/2) * parameters[parameter].length}" 
					height="{cell.height}">
					<div class="parameter-name {parameter_name} {parameter}" style="cursor: move">{parameter}</div>
				</foreignObject>
			</g>
			<g class="parameter-col {parameter}" transform="translate({$parameter_scale(parameter)}, {margin.top})">
				{#each d3.range(parameters[parameter].length - 1) as d, i}
					<foreignObject 
						class="option-join {d}" 
						x="{ (x2(i) + x2(i+1))/2 }"
						width="{iconSize}"
						height="{iconSize}">
							<OptionJoin {parameter} options={parameters[parameter]} index={i} on:join />				
					</foreignObject>
				{/each}
				{#each parameters[parameter] as option, i}
					<g class="option-headers {parameter} {option} option-{i}" transform="translate({$option_scale[parameter](i)}, 0)">
						<foreignObject 
							x="0" 
							y="{iconSize + cell.padding}" 
							width="{cell.width + cell.padding}" 
							height="{namingDim}" 
							class="option-name {option}">
								<OptionToggle {parameter} {option} on:hide/>
								<div class="option-label {option_names} {option}">{option}</div>
						</foreignObject>
					</g>
				{/each}
			</g>
		{/each}
	</svg>
	<svg class="grid-body" height={h} width={w}>
		{#each Object.keys(parameters) as parameter}
			<g class="parameter-col {parameter}" transform="translate({$parameter_scale(parameter)}, {gridNamesHeight})">
				{#each parameters[parameter] as option, i}
					<g class="option-value {parameter} {option} option-{i}" transform="translate({$option_scale[parameter](i)}, 0)">
						{#each data as universe, j}
							{#if universe[parameter].includes(option)}
								<rect 
									x="{(cell.width - cellWidth)/2}" 
									y="{y(j)}" 
									width="{cellWidth}" 
									height="{y.bandwidth()}"
									class="{options_container} {option} option-cell {selected_option}"
									row={j}
									on:click={openFile}
								/>
							{:else}
								<rect 
									x="{(cell.width - cellWidth)/2}" 
									y="{y(j)}" 
									width="{cellWidth}" 
									height="{y.bandwidth()}"
									class="{options_container} {option} option-cell"
									row={j}
									on:click={openFile}
								/>
							{/if}
						{/each}
					</g>
				{/each}
			</g>
		{/each}
		<SortByGroupDivider parameters={parameters} h={h}/>
	</svg>
</div>

<style>
	svg.grid-header {
		background-color: var(--bgColor) !important;
		display: inline-block;
		float: left;
		position: fixed;
		box-shadow: 0px 4px 5px -2px #c0c0c0;
	}

	svg.grid-body {
		background-color: var(--bgColor) !important;
		display: inline-block;
		float: left;
	}

	svg, rect {
		transition: width .5s linear, height .5s linear, x .5s linear, y .5s linear;
	}
</style>