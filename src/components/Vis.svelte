<script>
	import { css, cx } from '@emotion/css'
	import * as d3 from 'd3';
	import { onMount, createEventDispatcher } from 'svelte';
	import { windowHeight, cell, nameContainer, iconSize, groupPadding, margin, outVisWidth, header1, namingDim, scrollbarWidth } from './dimensions.js'
	import { gridCollapse } from './stores.js';
	import { colors } from './colorPallete.js';
	
	// this is out of necessity, not really used in the <script>
	let svg;
	let ypos = namingDim + 4 * cell.padding;

	// Stores
	let gridCollapse_value;

	gridCollapse.subscribe(value => gridCollapse_value = value);

	const dispatch = createEventDispatcher();
	
	export let i;
	export let allOutcomeVars;
	export let sortAscending;
	export let sortIndex;
	export let w; 
	export let h;
	export let term = allOutcomeVars[0];

	// CSS Styles
	export const container = css`
		background-color: ${colors.background};
		height: ${ypos}px;
		width: ${w - scrollbarWidth}px;
		position: absolute;
	`;
	
	onMount(() => {
		// this is used to make <Vis/> not blank on mount
		dispatch("mount");
	});
</script>

<style>
	svg.outcome-results {
		background-color: #f7f7f7;
		float: left;
		scrollbar-width: thin;
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
		flex:1
	}

	.vis-button {
		/* 34px is the height of the dropdown */
		position: sticky;
		top: 0;
		z-index: 2;
		height: 36px;
		border: none;
		background-color: #f7f7f7;
		flex:1;
		align-content: center;
	}

	.vis-button:hover > svg {
		background-color: lightcoral;
		fill: white;
	}
	.vis-button:active > svg {
		background-color: darkred;
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
		background-color: darkred;
		fill: white;
	}

	select {
		height: 36px;
		border: none;
		background-color: #f7f7f7;
		text-align: center;
	}

	svg.outcome-axis {
		display: inline-block;
		float: left;
		position: absolute;
	}
</style>

<div class="vis" id={"vis-"+i}>
	<div class={container}>
		<div class='vis-button-group'>
			<select class="vis-dropdown" id={"vis-"+i} bind:value={term} style="width:{w - 76 - scrollbarWidth}px;" on:change={() => dispatch("change")}>
				{#each allOutcomeVars as t}
					<option value={t}> {t} </option>
				{/each}
			</select>
			{#if sortIndex == i}
				{#if sortAscending}
					<button class="vis-button" id={"vis-"+i} on:click={()=> dispatch("changeSortDirection")}>
						<svg class="active_svg" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>
					</button>
				{:else}
					<button class="vis-button" id={"vis-"+i} on:click={()=> {dispatch("changeSortDirection"); dispatch("setSortIndex", -1)}}>
						<svg class="active_svg" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>						
					</button>
				{/if}
			{:else}
			<button class="vis-button" id={"vis-"+i} on:click={() => dispatch("setSortIndex", i)}>
				<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/></svg>
			</button>
			{/if}
			<button class="vis-button" id={"vis-"+i} on:click={() => dispatch("remove")}>
				<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
			</button>
		</div>
	</div>
	<svg class={"outcome-axis vis-"+i} bind:this={svg} height={windowHeight}px width={w - scrollbarWidth}></svg>
	<svg class={"outcome-results vis-"+i} bind:this={svg} height={h} width={w}></svg>
</div>