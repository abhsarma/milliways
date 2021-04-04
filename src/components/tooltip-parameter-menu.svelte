<script>
	import { cell, groupPadding } from './dimensions.js'
	import * as d3 from 'd3';

	export let parameter;
	export let xpos;
	export let parent_width

	function handleMouseenter(event) {
		d3.select(this).transition().duration(0)
			.style("visibility", "visible")
	}

	function handleMouseleave(event) {
		d3.select(this).transition()
			.duration(0.3)
			.delay(200)
			.style("visibility", "hidden")
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

	li {
		padding: 4px 10px;
	}

	.tooltip-menu {
		visibility: hidden;
		min-width: 120px;
		min-height: 120px;
		background-color: #4a4a4a;
		color: #fff;
		border-radius: 2px;

		/* Position the tooltip */
		position: absolute;
		z-index: 2;
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


<div 
	class="tooltip-menu {parameter}" 
	style="left: {xpos + parent_width + groupPadding + cell.padding}px;"
	on:mouseenter={handleMouseenter} on:mouseleave={handleMouseleave}>
	<ul>
		<li>Hide names</li>
		<li>Sort 1</li>
		<li>Sort 2</li>
	</ul>
</div>
