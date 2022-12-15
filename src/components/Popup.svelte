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
		width: ${popup.width}px;
		background-color: ${colors.popup};
		color: ${colors.text};
	`;

	export const pointerRight = css`
		transform: translate(-${(popup.shift + cell.padding + 1)}px, ${3*popup.shift/2}px) rotate(-135deg);;
	`;

	export const pointerLeft = css`
		transform: translate(${popup.shift + cell.padding + 1}px, ${3*popup.shift/2}px) rotate(45deg);;
	`;

	export const shiftLeft = css`
		transform: translate(-${popup.width + 2*popup.padding + popup.shift + cell.padding}px, -${3*popup.shift/2}px);
	`  // add some buffer

	export const shiftRight = css`
		transform: translate(${popup.shift + cell.padding}px, 0px);
	`  // add some buffer

	export const shiftCentre = css`
		transform: translate(-50%, -50%);
	`

	export const shadowLeft = css`
		box-shadow: -2px 2px 2px 0px #cccccc;
	`

	export const shadowRight = css`
		box-shadow: 2px 2px 2px 0px #cccccc;
	`

	export const shadowCentre = css`
		box-shadow: 0px 2px 2px 0px #cccccc;
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
	export let steps;

	let shift, shadow, pointer, next;
	let activePrev  = false, activeSkip = false, activeNext = false;

	if (direction == "right") {
		shift = shiftLeft;
		pointer = pointerRight;
		shadow = shadowRight;
	} else if (direction == "left") {
		shift = shiftRight;
		pointer = pointerLeft;
		shadow = shadowLeft;
	} else {
		// center
		shift = shiftCentre;
		shadow = shadowCentre;
		pointer = null;
	}

	function incrementCount() {
		step += 1
		dispatch('next', {
			step: step
		});
	}

	function decrementCount() {
		step -= 1
		dispatch('next', {
			step: step
		});
	}

	if (step == 0) {
		next = "Start Tutorial"
	} else if (step > 0 & step <= steps) {
		next = "Next"
	} else {
		next = "Finish"
	}

	function removeTutorial() {
		console.log("skipping...")
		dispatch('skip', {
			step: step
		});
	}

	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<div class="{infoPopup} {shift} {shadow} popup" style="top: {position.y}px; left: {position.x}px;">
	<p>{@html message}</p>
	{#if step > 0 & step <= steps}
		<p class="progress-indicator">{step}/{steps}</p>
	{/if}
	<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>{next}</button>
	{#if step > 0}
		<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
	{/if}
	<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} on:click={removeTutorial}>Skip</button>
</div>
{#if step > 0 & step <= steps}
	<div class="pointer {pointer}" style="top: {position.y}px; left: {position.x}px;"></div>
{/if}

<style type="text/css">
	p {
		margin: 8px 8px 32px 8px;
		font-family: 'Avenir Next';
	}

	p.progress-indicator {
		color: #aaaaaa;
	}

	button {
		margin: 0px 4px;
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
    	background-color: var(--hoverColor);
    	cursor: pointer;
    }

    .popup {
    	position: fixed;
		top: 50%;
		left: 50%;
		padding: 16px;
		border-radius: 8px;
		white-space: pre-wrap;
		z-index: 99;
    }

    .pointer {
		content: "";
		position: absolute;
		width: 0;
		height: 0;
		box-sizing: border-box;
		border: 8px solid black;
		border-color: transparent transparent #f0f0f0 #f0f0f0;
		box-shadow: -2px 2px 2px 0px #cccccc;
		transform-origin: 0 0;
		margin-left: 0em;
		bottom: 0em;
		left: 100%;
		z-index: 99;
    }
</style>