<script>
	import * as d3 from 'd3';
	import { text, header1, namingDim, cell, iconSize } from './dimensions.js'
	import { gridCollapse } from './stores.js';

	let active = false;
	let r = 20;

	function handleClick() {
		active = !active;
		let t = 400;
		let ypos;

		if (active) {
			gridCollapse.set(1);
		} else { 
			gridCollapse.set(0);
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

<div class="toggle" style="margin: {header1.top}px 0px">
	<p>grid collapse?</p>
	<div class="toggle-button" class:active={active} on:click="{handleClick}" style="height: {r}px">
		<div class="state-indicator" class:active={active} style="width: {r}px; height: {r}px"></div>
	</div>
</div>