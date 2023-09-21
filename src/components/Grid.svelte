<script>
	import { css } from '@emotion/css'
	import { range, max } from 'd3-array';
	import { scaleBand } from 'd3-scale';
	import { select, selectAll } from 'd3-selection';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import { margin, cell, groupPadding, gridNamesHeight, header, iconSize, namingDim, nameContainer } from '../utils/dimensions.js'
	import SortByGroupDivider from './sortByGroupDivider.svelte';
	import OptionToggle from './toggle-hide-option.svelte'
	import OptionJoin from './toggle-join-option.svelte'
	import { gridCollapse, exclude_options, parameter_scale, option_scale } from '../utils/stores.js'
	import { drag_options, drag_parameters, dragSortDivider } from '../utils/drag.js';

	export let data;
	export let parameters;
	export let analysis_doc;

	// CSS Styles
	export const parameter_name = css`
		font-size: ${header.size + "px"};
		font-family: 'Av-Nx', sans-serif;
		text-transform: uppercase;
		padding: 0px ${cell.padding/2 + "px"};
		background-color: ${colors.background};
		color: ${colors.gray90};
		cursor: default;
		overflow: hidden;
		text-overflow: ellipsis;
		height: ${cell.height}px;
		line-height: ${cell.height}px;
		text-align: center;
		width: 100%;
		user-select: none;
	`;

	export const parameter_label = css`
		line-height: ${cell.height}px;
		margin: 0px
	`

	export const option_names = css`
		font-size: ${header.size + "px"};
		font-family: 'Av-Nx', sans-serif;
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
	const x2 = scaleBand()
				.domain( range(max(Object.values(param_n_options))) )
				.range( [0, max(Object.values(param_n_options)) * (cell.width + cell.padding)] );

	$: { cellHeight = $gridCollapse ? 2 : cell.height }
	$: { cellWidth = $gridCollapse ? 8 : cell.width }
	$: w = (cell.width * n_options + cell.padding * (n_options - cols) + (cols + 1) * groupPadding) + 8;
	$: h = cell.padding + data.length * cellHeight + 2*margin.bottom;
	$: y = scaleBand()
		.domain(range(data.length))
		.range([margin.bottom, h - (margin.bottom + cell.padding) ])
		.padding(0.1);

	document.documentElement.style.setProperty('--bgColor', colors.background)
	document.documentElement.style.setProperty('--textColor', colors.gray90)

	let order = {};

  	Object.keys(parameters).forEach(function(d, i) {
  		let n = Object.values(parameters)[i].length;
		order[d] = { name: range(n).sort(function(a, b) { return a - b; }) }
	});

	let bgRect, scrollY = 0;

	onMount(() => {
		selectAll(".option-headers").call(drag_options(order));
		selectAll(".parameter").call(drag_parameters(param_n_options, y));
		select("g.grouped-sort-divider").call(dragSortDivider());
		bgRect = document.querySelector("#bg-rect");

		const grid_body = document.querySelector(".grid-container");

		grid_body.addEventListener("scroll", event => {
			scrollY = grid_body.scrollTop;
		}, { passive: true });
	})

	let mvWindow;
	const bc = new BroadcastChannel('mv');
	function openFile() {
		let spec = structuredClone(data[this.getAttribute("row")]);
		Object.keys(spec).forEach(param => spec[param] = spec[param][0]);

		if (!mvWindow || mvWindow.closed) {
			mvWindow = open(
							analysis_doc,
							analysis_doc,
							// process.env.ANALYSIS_DOC,
							// process.env.ANALYSIS_DOC,
							`top=0,
							 left=${screen.width}-960,
							 width=960,
							 height=${screen.height}
							`);

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
			mvWindow.focus();
			bc.postMessage(spec);
		}
	}

	function moveBgRect(yPos) {
		bgRect.setAttribute('y', yPos - cell.padding/2);
	}
</script>

<div class="grid" style="height:{h}px;">
	<svg class="grid-header" height={gridNamesHeight} width={w}>
		{#each Object.keys(parameters) as parameter}
			<g class="parameter {parameter}">
				<foreignObject 
					x="{$parameter_scale(parameter)}" 
					y="{cell.padding}" 
					width="{(cell.width + cell.padding/2) * parameters[parameter].length}" 
					height="{cell.height}">
					<!-- svelte-ignore a11y-missing-attribute -->
					<a class="tooltip-link" data-toggle="tooltip" title="{parameter}">
						<div class="parameter-name {parameter_name} {parameter}"><p class='parameter-label {parameter_label}'>{parameter}</p></div>
					</a>
				</foreignObject>
			</g>
			<g class="parameter-col {parameter}" transform="translate({$parameter_scale(parameter)}, {margin.top})">
				{#each range(parameters[parameter].length - 1) as d, i}
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
								<OptionToggle {parameters} {parameter} {option} on:hide/>
								<!-- svelte-ignore a11y-missing-attribute -->
								<a class="tooltip-link" data-toggle="tooltip" title="{option}">
									<div class="option-label parameter-{parameter} {option_names} {option}">{option}</div>
								</a>
						</foreignObject>
					</g>
				{/each}
			</g>
		{/each}
	</svg>
	<svg class="grid-body" height={h} width={w}>
		<rect 
			x=0
			y=-{y.bandwidth()+cell.padding}
			width=100%
			height={y.bandwidth()+cell.padding}
			id="bg-rect"
		/>
		{#each Object.keys(parameters) as parameter}
			<g class="parameter-col {parameter}" transform="translate({$parameter_scale(parameter)}, 0)">
				{#each parameters[parameter] as option, i}
					<g class="option-value {parameter} {option} option-{i}" transform="translate({$option_scale[parameter](i)}, 0)">
						{#each data as universe, j}
							{#if universe[parameter].includes(option)}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<rect 
									x={(cell.width - cellWidth)/2}
									y={y(j)}
									width={cellWidth} 
									height={y.bandwidth()}
									class="{options_container} {parameter} {option} option-cell {selected_option} universe-{j}"
									row={j}
									on:click={openFile}
									on:focus={() => moveBgRect(y(j))}
									on:mouseover={() => moveBgRect(y(j))}
								/>
							{:else if $exclude_options[parameter].includes(option)}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<rect 
									x={(cell.width - cellWidth)/2} 
									y={y(j)}
									width={cellWidth}
									height={y.bandwidth()}
									class="{options_container} {parameter} {option} option-cell exclude-rect universe-{j}"
									row={j}
									on:click={openFile}
									on:focus={() => moveBgRect(y(j))}
									on:mouseover={() => moveBgRect(y(j))}
								/>
							{:else}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<rect 
									x={(cell.width - cellWidth)/2} 
									y={y(j)}
									width={cellWidth}
									height={y.bandwidth()}
									class="{options_container} {parameter} {option} option-cell universe-{j}"
									row={j}
									on:click={openFile}
									on:focus={() => moveBgRect(y(j))}
									on:mouseover={() => moveBgRect(y(j))}
								/>
							{/if}
						{/each}
					</g>
				{/each}
			</g>
		{/each}
		<SortByGroupDivider bind:h={h} bind:y={scrollY}/>
	</svg>
	<!-- <svg class="grid-group-divider" height={windowHeight-gridNamesHeight} width={w}>
		<SortByGroupDivider parameters={parameters} h={windowHeight-gridNamesHeight}/>
	</svg> -->
</div>

<style>
	.to-front {
		z-index: 99;
	}

	foreignObject {
		border-radius: 4px;
	}

	div.grid {
		border: 1px solid #efefef;
	}

	svg.grid-header {
		background-color: var(--bgColor) !important;
		display: flex;
		position: sticky;
		top: 0;
		box-shadow: 0px 4px 5px -2px #cccccc;
		z-index: 10;
	}

	svg.grid-body {
		background-color: var(--bgColor) !important;
		display: inline-block;
		float: left;
		position: relative;
		z-index: 1;
		border-bottom-right-radius: 20px;
		border-bottom-left-radius: 20px;
	}

	svg, rect {
		transition: width .5s linear, height .5s linear, x .5s linear, y .5s linear;
	}

	#bg-rect {
		fill: #ffffff;
		stroke: #cccccc;
		transition: none;
	}

	div.parameter-name, .option-label {
		cursor: move;
	}

	a.tooltip-link {
		text-decoration: none;
		color: var(--textColor) ;
	}

	.exclude-rect {
		fill: #efefef !important;
	}
</style>