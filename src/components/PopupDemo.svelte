<script>
	import { css } from '@emotion/css';
	import { header, cell, nameContainer, gridNamesHeight } from '../utils/dimensions.js';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import Minimise from './icons/minimise.svelte';
	import Maximise from './icons/maximise.svelte';

	const dispatch = createEventDispatcher();

	export let message;
	export let step;
	export let steps;
	export let containsImage;

	let minimised = false, status = true;

	let pw;
	if (containsImage) {
		pw = '60%';
	} else {
		pw = '30%';
	}

	const infoPopup = css`
		width: ${pw};
		min-height: 64px;
		background-color: ${colors.popup};
		color: ${colors.text};
	`;

	const highlight_btn = css`
		background-color: ${colors.active};
		color: ${colors.white};
	`

	const plain_btn = css`
		color: ${colors.text};
		background-color: ${colors.popup};
	`
	let next, position, minified_position;

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

	if (step < steps) {
		next = "Next"
	} else {
		next = "Finish"
	}

	function removeTutorial() {
		dispatch('close', {
			step: step
		});
	}

	function minimiseTutorial() {

		dispatch('minimise', {
			state: minimised,
			step: step
		});
	}

	document.documentElement.style.setProperty('--hoverColor', colors.hover)
	document.documentElement.style.setProperty('--activeColor', colors.active)
	document.documentElement.style.setProperty('--secondaryColor', colors.secondary)

	onMount(() => {
		let element = document.querySelector('.demo-container')
		position = element.getBoundingClientRect();
		minified_position = {'x': (window.innerWidth - position.left - position.width/2 - 120) + "px", 'y': (position.bottom - position.height/2 - window.innerHeight + 40) + "px"}

		document.documentElement.style.setProperty('--min-x', minified_position.x)
		document.documentElement.style.setProperty('--min-y', minified_position.y)

		element.addEventListener('transitionend', () => {
			status = true;
		});
	});
</script>

<div class="demo-container {infoPopup}" class:minimised="{minimised}">
	{#if (status && !minimised)}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="action-btn" on:click={removeTutorial}>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M7.64645 7.29944L8.00024 7.65323L8.35379 7.2992L14.9367 0.707346L15.2837 1.05436L8.70033 7.64669L8.34725 8.00024L8.70056 8.35355L15.2929 14.9459L14.9459 15.2929L8.35355 8.70056L8 8.34701L7.64645 8.70056L1.05412 15.2929L0.707107 14.9459L7.29944 8.35355L7.65299 8L7.29944 7.64645L0.707107 1.05412L1.05412 0.707107L7.64645 7.29944Z" fill="#979797" stroke="#979797"/>
			</svg>
		</div>
	{/if}

	{#if (status && !minimised)}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="action-btn" on:click={() => { status = false; minimised = true; minimiseTutorial() }}>
			<Minimise h={18} w={18} fill={colors.gray70}/>
		</div>
	{:else if (status && minimised)}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="center-pos" on:click={() => { status = false; minimised = false; minimiseTutorial() }}>
			<Maximise h={18} w={18} fill={colors.white}/>
		</div>
	{/if}

	{#if (status && !minimised)}
		<div class="info-container">
			<p>{@html message}</p>
			{#if step > 0 & step <= steps}
				<p class="progress-indicator">{step}/{steps}</p>
			{/if}
			<button class="{highlight_btn} progress-btn next-btn" on:click={incrementCount}>{next}</button>
			{#if step > 0}
				<button class="{plain_btn} progress-btn plain-btn" on:click={decrementCount}>Prev</button>
			{/if}
		</div>
	{/if}
</div>

<style type="text/css">
	.demo-container {
		position: fixed;
		top: 50%;
		left: 50%;
		padding: 4px;
		border-radius: 8px;
		white-space: pre-wrap;
		transform: translate(-50%, -50%);
		box-shadow: 0px 2px 2px 0px #cccccc;
		transition: ease-in-out .5s;
		z-index: 99;
	}
	
	.minimised {
		position: fixed;
		height: 64px;
		width: 64px;
		border-radius: 64px;
		white-space: nowrap;
		color: #ffffff;
		background-color: #99A3E0;
		margin: 0px;
		padding: 0px;
		transform: translate(var(--min-x), var(--min-y));
		transition: ease-in-out .5s;
		box-shadow: 0px 0px 5px 0px #cccccc;
		cursor: pointer;
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

	.center-pos {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		border-radius: 64px;
	}

	.center-pos:hover,
	.center-pos:active,
	.center-pos:focus {
		background-color: var(--secondaryColor);
	}

	button {
		font-family: 'Av-Nx', sans-serif;
		border: none;
		border-radius: 4px;
	}	

	p {
		font-family: 'Av-Nx', sans-serif;
		margin: 16px;
		font-size: 14px;
		line-height: 20px;
	}

	p.progress-indicator {
		color: #aaaaaa;
	}

	:global(.demo-list) {
		margin: 0px 0px 32px 8px;
	}

	:global(.emphasis) {
		font-style: italic;
		font-weight: 700;
	}

	:global(.demo-list > li) {
		margin: 8px 0px !important;
	}

	:global(video) {
		border-radius: 8px;
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

    .info-container {
    	padding: 12px;
    }

    .info-container:after { 
		content: "."; 
		visibility: hidden; 
		display: block; 
		height: 0; 
		clear: both;
	}
</style>