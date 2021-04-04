<script>
	import { cell, groupPadding, margin, outVisWidth, h1 } from './dimensions.js'
	export let text;

	const header_size = h1;

	let w = "120px";
	let m = "24px";

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

	p {
		font-family: 'Avenir Next';
		font-size: 14px;
		line-height: 14px;
		padding: 0 2px;
		text-transform: uppercase;
		display: inline-block;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;		
		
		width: 100%;
	}

	#tooltip {
		display: inline-block;
		cursor: default;
		font-family: 'Avenir Next';
		text-transform: uppercase;
		cursor: default;
		position: relative;
	}

	.tooltip-menu {
		visibility: hidden;
		min-width: 120px;
		min-height: 120px;
		background-color: #4a4a4a;
		color: #fff;
		border-radius: 2px;
		opacity: 0;
		transition: opacity 0.3s;

		/* Position the tooltip */
		position: absolute;
		z-index: 2;
		top: 100px;
		left: 300px;
	}

	#tooltip:hover ~ .tooltip-menu {
		visibility: visible;
		opacity: 1;
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

<div>
	<div id="tooltip" style="width: {w}; margin-left: {m}">
		<p>{text}</p>
	</div>
	<div class="tooltip-menu">
		<ul>
			<li>Hide names</li>
			<li>Sort 1</li>
			<li>Sort 2</li>
		</ul>
	</div>
</div>

<!-- <div class="tooltip" style="width: {w}; margin-left: {m}">
	<p>{text}</p>
	<div class="tooltip-menu">
		<ul>
			<li>Hide names</li>
			<li>Sort 1</li>
			<li>Sort 2</li>
		</ul>
	</div>
</div> -->
