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
		/* 34px is the height of the dropdown */
		position: sticky;
		top: 0;
		z-index: 2;
		float: right;
		width: 36px;
		height: 36px;
		right: 0;
		margin: 0 0 0 -36px;
		border: none;
		background-color: #f7f7f7;
	}
	.vis-remove:hover > svg {
		background-color: lightcoral;
		fill: white;
	}
	.vis-remove:active > svg {
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

	select {
		height: 36px;
		border: none;
		background-color: #f7f7f7;
		text-align: center;
	}
</style>

<div class="vis" id={"vis-"+i}>
	<select class="vis-dropdown"
			id={"vis-"+i}
			style="width:{0.6*w}px; margin: 0 {-w}px 0 {0.2*w}px;"
			bind:value={term}
			on:change={() => dispatch("change")}>
		{#each allOutcomeVars as t}
			<option value={t}>
				{t}
			</option>
		{/each}
	</select>
	<button class="vis-remove" id={"vis-"+i} on:click={() => dispatch("remove")}>
		<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
	</button>
	<svg id={"vis-"+i} bind:this={svg} height={h} width={w}></svg>
</div>