<script>
	import { css, cx } from '@emotion/css'
	import * as d3 from 'd3';
	import { text, header, cell, iconSize } from '../utils/dimensions.js'
	import { gridCollapse } from '../utils/stores.js';

	export let menu;
	export let interfaceTutorial

	function showMenu() {
		menu = !menu;
	}

	function showInterfaceTutorial() {
		interfaceTutorial = true
	}

	function showHandsOnTutorial() {
		// nothing for now
	}
</script>

<div class="help-dropdown">
	<div class="help-button" class:active={menu} on:click={showMenu}>
		<p class="help help-header">Help</p>
	</div>
	{#if menu}
		<div class="help-dropdown-menu" >
			<p class="help-option" on:click={showInterfaceTutorial}>Interface Help</p>
			<p class="help-option" on:click={showHandsOnTutorial}>Hands-on Tutorial</p>
		</div>
	{/if}
</div>

<style>
	.help-dropdown {
		height: 40px;
		padding: 12px 16px;
	}

	.help-button {
		height: 40px;
		cursor: pointer;
	}

	.help-button:hover, 
	.help-button:active,
	.help-button:focus {
		background-color: #efefef;
		border-radius: 4px;
	}

	.active {
		background-color: #efefef;
		border-radius: 4px 4px 0px 0px !important;
	}

	p {
		margin: 0px;
		line-height: 32px;
		font-family: 'Avenir Next';
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
		box-shadow: 0px 4px 5px -2px #c0c0c0;
		position: fixed;
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