<script>
	import * as d3 from 'd3';
	import { createEventDispatcher } from 'svelte';
	import { outVisWidth, margin } from './dimensions.js'
	
	const dispatch = createEventDispatcher();

	export let items;
	let selected;

	function updateOutcome() {
		dispatch('message', {text: selected})
	}
</script>

<style>
	div {
		position: absolute;
	}

	select {
		font-family: 'Avenir Next';
		font-size: 14px;
		font-weight: 300;
		margin: 0px 8px;
		background-color: #f7f7f7;
		border: none;
	}
</style>

<div>
	<!-- <select value={selected} on:change="{() => answer = ''}"> -->
	<select bind:value={selected} on:change={updateOutcome} style="width: ${outVisWidth + margin.left - 16}px">
		{#each items as outcome}
			<option value={outcome}>
				{outcome}
			</option>
		{/each}
	</select>
</div>