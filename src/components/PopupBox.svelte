<script>
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, popup } from '../utils/dimensions.js';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export const popupBg = css`
		position:absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		background-color: ${colors.gray+"80"};
		backdrop-filter: blur(3px);
		z-index: 9;
	`

	export const infoPopup = css`
		position: fixed;
		top: 50%;
		left: 50%;
		width: ${popup.width}px;
		padding: 16px;
		background-color: ${colors.popup};
		color: ${colors.text};
		border-radius: 8px;
		white-space: pre-wrap;
		z-index: 99;
	`;

	export const pointerRight  = css`
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-${popup.shift + cell.padding}px, -${popup.shift/2}px);
		width: 0; 
		height: 0;
		border-top: ${popup.shift}px solid transparent;
		border-bottom: ${popup.shift}px solid transparent;
		border-left: ${popup.shift}px solid ${colors.popup};
		z-index: 99;
	`

	export const pointerLeft  = css`
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(${cell.padding}px, ${popup.shift}px);
		width: 0; 
		height: 0;
		border-top: ${popup.shift}px solid transparent;
		border-bottom: ${popup.shift}px solid transparent;
		border-right: ${popup.shift}px solid ${colors.popup};
		z-index: 99;
	`

	export const highlight_btn = css`
		background-color: ${colors.active};
		color: ${colors.white};
	`

	export const plain_btn = css`
		color: ${colors.text};
		background-color: ${colors.popup};
	`

	export let message;
	export let step;
	export let position;
	export let direction;

	let activePrev  = false, activeSkip = false, activeNext = false;

	function incrementCount() {
		step += 1
		dispatch('message', {
			step: step
		});
	}

	function decrementCount() {
		step -= 1
		dispatch('message', {
			step: step
		});
	}

	$: next = step == 0 ? "Start Tutorial" : "Next"
</script>

<div class="{infoPopup} {direction}" style="top: {position.y}px; left: {position.x}px;">
	<p>{@html message}</p>
	<!-- {#if step > 0}
		<p class="progress-indicator">{step}/N</p>
	{/if} -->
	<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>{next}</button>
	{#if step > 0}
		<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
	{/if}
	<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} onclick="(e=>e.parentElement.parentElement.remove())(this)">Skip</button>
</div>
{#if step > 0}
	<div class="{pointerRight}" style="top: {position.y}px; left: {position.x}px;"></div>
{/if}

<style type="text/css">
	p {
		margin: 8px 8px 32px 8px;
		font-family: 'Avenir Next';
	}

	button {
		margin: 0px 8px;
		font-family: 'Avenir Next';
		border: none;
		padding: 8px 16px;
		float: right;
		border-radius: 4px;
	}

    .progress-indicator {
    	display: inline-block;
    	padding: 8px 0px;
    	margin: 0px;
    }

	.activePrev  {
		background-color: #e0e0e0;
		cursor: pointer;
	}

	.activeSkip {
		background-color: #e0e0e0;
		cursor: pointer;
	}

	.activeNext {
    	background-color: #ED8A68;
    	cursor: pointer;
    }
</style>