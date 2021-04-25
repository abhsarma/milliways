<script>
	import * as d3 from 'd3';
	import { text, margin, namingDim, cell } from './dimensions.js'
	import { state } from './stores.js';

	let active = false;
	let r = 20;

	function handleClick() {
		active = !active;
		let t = 400;

		if (active) {
			state.set(0);
			d3.selectAll("g.option-name")
				.transition()
				.duration(t)
				.ease(d3.easeCubic)
				.style("opacity", 0);

			d3.selectAll("g.option-value")
				.each(function(d){
					let coords = d3.select(this).attr("transform").replace(/[a-z()\s]/g, '').split(",").map(x => +x);
					d3.select(this)
						.transition()
						.duration(t)
						.ease(d3.easeCubic)
						.attr("transform", `translate(${coords[0]}, 0)`)
				})

			d3.selectAll("g.outcomePanel")
				.transition()
				.duration(t)
				.ease(d3.easeCubic)
				.attr( "transform", `translate(0, 0)`)

		} else { 
			state.set(1);
			d3.selectAll("g.option-name")
				.transition()
				.duration(t)
				.ease(d3.easeCubic)
				.style("opacity", 1);
				// .attr("visibility", "visible");

			d3.selectAll("g.option-value")
				.each(function(d){
					let coords = d3.select(this).attr("transform").replace(/[a-z()\s]/g, '').split(",").map(x => +x);
					d3.select(this)
						.transition()
						.duration(t)
						.ease(d3.easeCubic)
						.attr("transform", `translate(${coords[0]}, ${namingDim + cell.padding})`)
				})

			d3.selectAll("g.outcomePanel")
				.transition()
				.duration(t)
				.ease(d3.easeCubic)
				.attr( "transform", `translate(0, ${namingDim + cell.padding})`)
		}
	}
</script>

<style>
	.toggle {
		display: inline-flex;
	}

	p {
		display: inline-block;
		margin: 0px 12px 0px 0px;
		line-height: 30px;
		font-family: 'Avenir Next';
		font-size: 14px;
		font-weight: 300;
		align-items: center;
		text-align: right;
		width: 180px;
	}

	.toggle-button {
		width: 40px;
		background-color: #fafafa;
		border-radius: 20px;
		border: 1px solid #979797;
		display: inline-block;
		padding: 4px;
		/* Firefox */
	    -moz-transition: all 0.4s ease-in-out;
	    /* WebKit */
	    -webkit-transition: all 0.4s ease-in-out;
	    /* Opera */
	    -o-transition: all 0.4s ease-in-out;
	    /* Standard */
	    transition: all 0.4s ease-in-out;
	}


	.toggle-button.active {
		background-color: #BCF8BC;
	}

	.state-indicator {
		border-radius: 12px;
		background-color: #a0a0a0;
		display: inline-block;
		/* Firefox */
	    -moz-transition: all 0.4s ease-in-out;
	    /* WebKit */
	    -webkit-transition: all 0.4s ease-in-out;
	    /* Opera */
	    -o-transition: all 0.4s ease-in-out;
	    /* Standard */
	    transition: all 0.4s ease-in-out;
	}

	.state-indicator.active {
		transform: translate(100%, 0);
	}
</style>

<div class="toggle" style="margin: {margin.top}px 0px">
	<!-- {#if state == 0}
		<p>hide option names</p>
	{:else}
		<p>hide option names</p>
	{/if} -->
	<p>hide option names</p>
	<div class="toggle-button" class:active={active} on:click="{handleClick}" style="height: {r}px">
		<div class="state-indicator" class:active={active} style="width: {r}px; height: {r}px"></div>
	</div>
</div>