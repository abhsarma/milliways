<script>
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight, popup } from '../utils/dimensions.js';
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

	let pw;
	if (containsImage) {
		pw = 496;
	} else {
		pw = popup.width;
	}

	const infoPopup = css`
		width: ${pw}px;
		background-color: ${colors.popup};
		color: ${colors.text};
	`;

	const pointerRight = css`
		transform: translate(-${(popup.shift + cell.padding + 1)}px, ${3*popup.shift/2}px) rotate(-135deg);;
	`;

	const pointerLeft = css`
		transform: translate(${popup.shift + cell.padding + 1}px, ${3*popup.shift/2}px) rotate(45deg);;
	`;

	const shiftLeft = css`
		transform: translate(-${popup.width + 2*popup.padding + popup.shift + cell.padding}px, -${3*popup.shift/2}px);
	`  // add some buffer

	const shiftRight = css`
		transform: translate(${popup.shift + cell.padding}px, 0px);
	`  // add some buffer

	const shiftCentre = css`
		transform: translate(-50%, -50%);
	`

	const shadowLeft = css`
		box-shadow: -2px 2px 2px 0px #cccccc;
	`

	const shadowRight = css`
		box-shadow: 2px 2px 2px 0px #cccccc;
	`

	const shadowCentre = css`
		box-shadow: 0px 2px 2px 0px #cccccc;
	`

	const highlight_btn = css`
		background-color: ${colors.secondary};
		color: ${colors.white};
	`

	const plain_btn = css`
		color: ${colors.text};
		background-color: ${colors.popup};
	`
	let shift, shadow, next, pointerPos = null;

	if (direction == "left") {
		shift = shiftLeft;
		shadow = shadowRight;
	} else if (direction == "right") {
		shift = shiftRight;
		shadow = shadowLeft;
	} else if (direction == "centre") {
		// center
		shift = shiftCentre;
		shadow = shadowCentre;
	}

	if (pointer == "left") {
		pointerPos = pointerLeft;
	} else if (pointer == "right") {
		pointerPos = pointerRight;
	} else if (pointer == "hidden") {
		pointerPos = null;
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
		console.log("skipping tutorial...")
		dispatch('skip', {
			step: step
		});
	}

	document.documentElement.style.setProperty('--hoverColor', colors.hover)
	document.documentElement.style.setProperty('--secondaryColor', colors.secondary)
</script>

<div class="{infoPopup} {shift} {shadow} popup" style="top: {position.y + adjust.y}px; left: {position.x + adjust.x}px;">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="action-btn" on:click={removeTutorial}>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M7.64645 7.29944L8.00024 7.65323L8.35379 7.2992L14.9367 0.707346L15.2837 1.05436L8.70033 7.64669L8.34725 8.00024L8.70056 8.35355L15.2929 14.9459L14.9459 15.2929L8.35355 8.70056L8 8.34701L7.64645 8.70056L1.05412 15.2929L0.707107 14.9459L7.29944 8.35355L7.65299 8L7.29944 7.64645L0.707107 1.05412L1.05412 0.707107L7.64645 7.29944Z" fill="#979797" stroke="#979797"/>
		</svg>
	</div>
	<p>{@html message}</p>
	{#if step > 0 & step <= steps}
		<p class="progress-indicator">{step}/{steps}</p>
	{/if}
	<button class="{highlight_btn} progress-btn next-btn" on:click={incrementCount}>{next}</button>
	{#if step > 0}
		<button class="{plain_btn} progress-btn plain-btn" on:click={decrementCount}>Prev</button>
	{/if}
</div>
{#if pointerPos}
	<div class="pointer {pointerPos}" style="top: {position.y}px; left: {position.x}px;"></div>
}
{/if}

<style type="text/css">
	p {
		margin: 8px 8px 32px 8px;
		font-family: 'Av-Nx', sans-serif;
		font-size: 14px;
		line-height: 20px;
	}

	p.progress-indicator {
		color: #aaaaaa;
	}

	:global(.definition) {
		font-style: italic;
		color: var(--secondaryColor);
	}

	button {
		font-family: 'Av-Nx', sans-serif;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		line-height: 20px;
	}

	.action-btn {
		border-radius: 4px;
		padding: 12px;
		cursor: pointer;
		float: right;
		background-color: transparent;
	}

	.action-btn:hover,
	.action-btn:active,
	.action-btn:focus {
		background-color: #e0e0e0;
	}

	.progress-btn {
		margin: 0px 4px;
		padding: 8px 16px;
		cursor: pointer;
		float: right;
	}

	.plain-btn:hover,
	.plain-btn:active,
	.plain-btn:focus {
		background-color: #e0e0e0;
	}

	.next-btn:hover,
	.next-btn:active,
	.next-btn:focus {
		background-color: var(--hoverColor);
	}

    .progress-indicator {
    	display: inline-block;
    	padding: 8px 0px;
    	margin: 0px;
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