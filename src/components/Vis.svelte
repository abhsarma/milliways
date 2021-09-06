<script>
	import { onMount, createEventDispatcher } from 'svelte';
	
	// this is out of necessity, not really used in the <script>
	let svg;

	const dispatch = createEventDispatcher();
	
	export let i;
	export let allOutcomeVars;
	export let w; 
	export let h;
	export let term = allOutcomeVars[0];
	
	
	onMount(() => {
		// this is used to make <Vis/> not blank on mount
		dispatch("mount");
	});
</script>

<style>
	svg {
		background-color: #f7f7f7;
		/* display: inline-block; */
		float: left;
	}

	.vis-dropdown {
		position: sticky;
		top: 0;
		z-index: 1;
		float: left;
		/* height: 38px; (default) */
	}

	.vis-remove {
		/* 38px is the height of the dropdown */
		position: sticky;
		top: 0;
		z-index: 2;
		float: right;
		width: 38px;
		height: 38px;
		right: 0;
		margin: 0 0 0 -38px;
	}
	.vis-remove:hover {
		background-color:lightcoral;
	}
	.vis-remove:active {
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
</style>

<div class="vis" id={"vis-"+i}>
	<select class="vis-dropdown"
			id={"vis-"+i}
			style="
				left:{-w}px;
				width:{w - 38}px;
				margin: 0 {-w}px 0 0;
			"
			bind:value={term}
			on:change={() => dispatch("change")}>
		{#each allOutcomeVars as t}
			<option value={t}>
				{t}
			</option>
		{/each}
	</select>
	<button class="vis-remove" id={"vis-"+i} on:click={() => dispatch("remove")}>X</button>
	<svg id={"vis-"+i} bind:this={svg} height={h} width={w}></svg>
</div>