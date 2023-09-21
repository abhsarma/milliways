<script>
	import { colors } from '../utils/colorPallete.js';
	import { gridCollapse } from '../utils/stores.js';

	let active = false;
	let r = 22;
	let a = 12; // svg dimension
	let state = "out"

	function handleClick() {
		active = !active;

		if (active) {
			state = "in"
			gridCollapse.set(1);
		} else { 
			state = "out"
			gridCollapse.set(0);
		}
	}

	document.documentElement.style.setProperty('--zoomColor', colors.zoom)
</script>

<div class="toggle">
	<div class="text-container">
		<p class="left">zoom</p>
	</div>
	<svg width="{a}" height="{a}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M0 13V11H11V0H13V11H24V13H13V24H11V13H0Z" fill="#4f4f4f"/>
	</svg>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="toggle-button" class:active={active} on:click="{handleClick}" style="height: {r}px">
		<div class="state-indicator" class:active={active} style="width: {r}px; height: {r}px"></div>
	</div>
	<svg width="{a}" height="{a}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M4 13.25V11.25H28V13.25H4Z" fill="#4f4f4f"/>
	</svg>
</div>

<style>
	.toggle {
		position: relative;
		padding: 8px 32px;
		height: 48px;
		border-radius: 4px;
		display: inline-flex;
	}

	svg {
		margin: 18px 8px; /* (48 - a)/2 */
	}

	p {
		display: inline-block;
		line-height: 32px;
		font-family: 'Av-Nx', sans-serif;
		font-size: 14px;
		font-weight: 300;
		align-items: center;
		vertical-align: middle;
		margin-top: 8px;
		width: 64px;
		text-align: right;
	}

	.text-container {
		height: 48px;
		cursor: default;
	}

	.toggle-button {
		width: 40px;
		background-color: #fafafa;
		border-radius: 22px;
		border: 1px solid #666666;
		display: inline-block;
		padding: 4px;
		margin-top: 8px;
		cursor: pointer;
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
		background-color: var(--zoomColor);
	}

	.state-indicator {
		border-radius: 12px;
		background-color: #666666;
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
		transform: translate(18px, 0);
	}
</style>