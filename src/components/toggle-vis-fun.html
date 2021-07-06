<script>
	import { cell, groupPadding } from './dimensions.js'
	import * as d3 from 'd3';
	import { selected, multi_param } from './stores.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let selected_value;
	let selected_parameters;
	let option;

	selected.subscribe(value => {
		selected_value = value;
	});

	multi_param.subscribe(value => {
		selected_parameters = value;
	});

	function handleMouseenter(event) {
		d3.select(this).transition().duration(0)
			.style("visibility", "visible")
	}

	function handleMouseleave(event) {
		d3.select(this).transition()
			.duration(0.2)
			.delay(100)
			.style("visibility", "hidden")
	}

	function excludeOptions() {
		dispatch('message', {
			action: 'exclude'
		})
	}

	function joinOptions() {
		dispatch('message', {
			action: 'join'
		})
	}
</script>

<style>
	ul {
		list-style-type: none;
		margin: 0;
		padding: 0;
		font-size: 12px;
		line-height: 14px;
	}

	.tooltip-menu {
		visibility: hidden;
		width: 120px;
		padding: 4px 10px;
		background-color: #4a4a4a;
		color: #fff;
		border-radius: 2px;

		/* Position the tooltip */
		position: absolute;
		z-index: 2;
		box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.2);
	}

	.tooltip-menu ul li{
		font-family: 'Avenir Next';
		width: 100%;
		background-color: #4a4a4a;
		line-height: 32px;
	}

	.tooltip-menu ul li:hover{
		background-color: #333333;
		cursor: pointer;
	}
</style>


<div class="tooltip-menu" id="option-menu">
	{#if selected_value > 1}
		{#if selected_parameters === 1}
			<ul>
				<li on:click={excludeOptions}>Exclude options</li>
				<li on:click={joinOptions}>Join options</li>
			</ul>
		{:else}
			<ul>
				<li on:click={excludeOptions}>Exclude options</li>
			</ul>
		{/if}
	{:else}
		<ul>
			<li on:click={excludeOptions}>Exclude option</li>
		</ul>
	{/if}
</div>
