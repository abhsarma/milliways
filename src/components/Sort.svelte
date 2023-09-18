<script>
	import { css, cx } from '@emotion/css'
	import { colors } from '../utils/colorPallete.js';
	import { createEventDispatcher } from 'svelte';

	export let i, w, padding, index, order;

	const dispatch = createEventDispatcher();

	export const sortButton = css`
		/* 34px is the height of the dropdown */
		position: sticky;
		top: 0;
		z-index: 2;
		width: ${w}px;
		height: ${w}px;
		padding: ${padding}px;
		background-color: transparent !important;
		border: none;
		border-radius: 4px;
		align-content: center;
		cursor: pointer;
		box-sizing: content-box;

	`
	document.documentElement.style.setProperty('--grayColor', colors.gray70)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

{#if index == i}
	{#if order == 1}
		<button class="sort-button {sortButton}" id="vis-{i}" on:click={()=> dispatch("changeSortDirection")}> 
			<svg version="1.1" id="Layer_1" class="active_svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 18 18;" xml:space="preserve" width="{w}px" fill="#000000">
				<path d="M12,5L8,9h3v10h2V9h3L12,5z"/>
			</svg>
		</button>
	{:else}
		<button class="sort-button {sortButton}" id="vis-{i}" on:click={()=> {dispatch("changeSortDirection");  dispatch("setSortIndex", -1)}}>
			<svg version="1.1" id="Layer_1" class="active_svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 18 18;" xml:space="preserve" width="{w}px" fill="#000000">
				<path d="M11.9,19l4-4h-3V5h-2v10h-3L11.9,19z"/>
			</svg>
		</button>
	{/if}
{:else}
	<button class="sort-button {sortButton}" id="vis-{i}" on:click={() => dispatch("setSortIndex", i)}>
		<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" height="{w}px"	viewBox="0 0 24 24" style="enable-background:new 0 0 18 18;" xml:space="preserve" width="{w}px" fill="#000000">
			<path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
		</svg>
	</button>
{/if}

<style>
	.sort-button:hover > svg {
		background-color: var(--hoverColor);
		fill: #ffffff;
	}

	.sort-button:active > svg {
		background-color: var(--hoverColor);
		fill: #ffffff;
	}

	.sort-button:focus > svg {
		background-color: var(--hoverColor);
		fill: #ffffff;
	}

	svg {
		border-radius: 4px;
	}

	.active_svg {
		background-color: rgb(220, 224, 230);
	}
</style>