<script>
	import { css, cx } from '@emotion/css'
	import { colors } from '../utils/colorPallete.js';
	import { text, header, cell, iconSize } from '../utils/dimensions.js'
	import { gridCollapse } from '../utils/stores.js';

	export let menu;
	export let interfaceTutorial;
	export let demo;

	function showMenu() {
		menu = !menu;
	}

	function showInterfaceTutorial() {
		interfaceTutorial = true;
	}

	function showDemo() {
		demo = true; // nothing for now
	}


	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<div class="help-dropdown">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="help-button" class:selected={menu} on:click={showMenu}>
		<p class="help help-header">Help</p>
	</div>
	{#if menu}
		<div class="help-dropdown-menu" >
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<p class="help-option" on:click={showInterfaceTutorial}>Quick Tour</p>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<p class="help-option" on:click={showDemo}>Demo</p>
		</div>
	{/if}
</div>

<style>
	.help-dropdown {
		height: 40px;
		width: 180px;
		padding: 12px 32px;
	}

	.help-button {
		height: 40px;
		width: 64px;
		border-radius: 4px;
		text-align: center;
		cursor: pointer;
	}

	.selected {
		background-color: #dddddd;
	}

	.help-button:hover, 
	.help-button:active,
	.help-button:focus {
		background-color: #dddddd;
	}

	p {
		margin: 0px;
		line-height: 32px;
		font-family: 'Av-Nx', sans-serif;
		font-size: 14px;
		font-weight: 300;
		vertical-align: middle;
	}

	p.help-header {
		text-align: center;
		padding: 4px 16px;
	}

	.help-dropdown-menu {
		width: 180px;
		background-color: #fafafa;
		box-shadow: 0px 4px 5px -2px #cccccc;
		position: relative;
		z-index: 999;

	}

	p.help-option {
		cursor: pointer;
		padding: 4px 16px;
	}

	p.help-option:active, 
	p.help-option:hover, 
	p.help-option:focus {
		background-color: #efefef;
	}
</style>