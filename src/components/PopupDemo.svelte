<script>
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, demo } from '../utils/dimensions.js';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let message;
	export let step;
	export let position;
	export let adjust;
	export let direction;
	export let pointer;
	export let steps;
	export let containsImage;

	let pw = demo.width;
	// if (containsImage) {
	// 	pw = 496;
	// } else {
	// 	pw = demo.width;
	// }

	console.log(pw)

	const infoPopup = css`
		width: ${pw}px;
		background-color: ${colors.popup};
		color: ${colors.text};
	`;

	const shift = css`
		transform: translate(-50%, -50%);
	`

	const shadow = css`
		box-shadow: 0px 2px 2px 0px #cccccc;
	`

	const highlight_btn = css`
		background-color: ${colors.active};
		color: ${colors.white};
	`

	const plain_btn = css`
		color: ${colors.text};
		background-color: ${colors.popup};
	`
	let next;
	let activePrev  = false, activeSkip = false, activeNext = false;

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

	if (step <= steps) {
		next = "Next"
	} else {
		next = "Finish"
	}

	function removeTutorial() {
		console.log("skipping tutorial...")
		dispatch('skip', {
			step: step
		});
	}

	document.documentElement.style.setProperty('--hoverColor', colors.hover)
	document.documentElement.style.setProperty('--secondaryColor', colors.secondary)
</script>

<div class="{infoPopup} {shift} {shadow} popup" style="top: {position.y + adjust.y}px; left: {position.x + adjust.x}px;">
	<button class="{plain_btn}" class:activeSkip on:mouseenter={() => activeSkip = true} on:mouseleave={() => activeSkip = false} on:click={removeTutorial}>
		<svg class="svg" width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
			<path d="M6 5.293L10.646.646l.707.708L6.708 6l4.647 4.646-.708.708L6 6.707l-4.646 4.647-.708-.707L5.293 6 .646 1.354l.708-.707L6 5.293z" fill-rule="evenodd" fill-opacity="1" fill="#666666" stroke="none"></path>
		</svg>
	</button>
	<p>{@html message}</p>
	{#if step > 0 & step <= steps}
		<p class="progress-indicator">{step}/{steps}</p>
	{/if}
	<button class="{highlight_btn}" class:activeNext on:mouseenter={() => activeNext = true} on:mouseleave={() => activeNext = false} on:click={incrementCount}>{next}</button>
	{#if step > 0}
		<button class="{plain_btn}" class:activePrev on:mouseenter={() => activePrev = true} on:mouseleave={() => activePrev = false} on:click={decrementCount}>Prev</button>
	{/if}
</div>

<style type="text/css">
	p {
		margin: 0px 80px 32px 8px;
		font-family: 'Avenir Next';
	}

	p.progress-indicator {
		color: #aaaaaa;
	}

	:global(.definition) {
		font-style: italic;
		color: var(--secondaryColor);
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
    	position: absolute;
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