<script>
	import { css } from '@emotion/css';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import ParamOptions from "./ParamOptions.svelte";

	export let line;
	export let parameter;
	export let options;

	let paramOptionHtml;
	let show = false;

	export const highlight = css`
		opacity: 0.8;
		cursor: pointer;
		background-color: ${colors.density};
	`;


	/*
		NOTES:
		branchRegex:
		- it assumes the content in the parentheses is a valid R variable name
		- if "branch(...)" is preceded by any \w, i.e. [a-zA-Z0-9_], it will not match.
		paramRegex:
		- it just takes anything between 'branch(' and the first ')' afterwards
	*/	
	const branchRegex = /(.*\s*)(\bbranch\s*\(\s*[a-zA-Z_0-9]+\s*\))(.*)/;
	let segments, branch, pre_branch, post_branch
	try {
		segments = line.match(branchRegex);
		// pre: segments[1]; branch: segments[2], post: segments[3] // 0 is the whole match
		pre_branch = segments[1];
		branch = segments[2];
		post_branch = segments[3];
	} catch (e) {
		segments = undefined
		pre_branch = line;
	}

	if (parameter && !segments) {
		console.log("contains parameter, but regex failed to detect it")
	}

	function highlightParam (event) {
		let el = document.querySelector(`div.parameter-name.${parameter}`)

		el.style.color = colors.white;
		el.style.background = colors.hover;
		el.style.fontWeight = "600";
		// highlight parameter on the grid
	}

	function removeHighlight () {
		// remove highlight of parameter name on grid
		// document.querySelector(`div.parameter-name.${parameter}`).style('color: black');
		let el = document.querySelector(`div.parameter-name.${parameter}`);
		el.style.color = colors.gray90;
		el.style.background = colors.background;
		el.style.fontWeight = "400";

	}

	onMount(() => {
		if (parameter) {
			let els = document.querySelectorAll(`.code-line-${parameter}`);

			els.forEach( x => {
				x.addEventListener(
					'click',
					function() {
						if (show) {
							paramOptionHtml.style.display = 'none';
							this.style.backgroundColor = colors.density;
							this.style.color = colors.text;
						} else {
							paramOptionHtml.style.display = 'block';
							this.style.backgroundColor = colors.hover;
							this.style.color = colors.white;
						}
						show = !show;
					}
				)

				x.addEventListener('mouseover', function() { 
					this.style.backgroundColor = colors.hover 
					this.style.color = colors.white;
				});

				x.addEventListener('mouseout', function() { 
					this.style.backgroundColor = colors.density 
					this.style.color = colors.text;
				});
			})
		}
	})
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<div class="code-line-container">
	<!-- something weird happens with the pre-tags 
		when the following block of code is indetted
		and new-lines are used. -->
	{#if (parameter && segments)}
		<!-- svelte-ignore a11y-mouse-events-have-key-events -->
		<pre class="code-line"><span>{pre_branch}</span><span class='{highlight} code-line-{parameter}' on:mouseover={highlightParam} on:mouseout={removeHighlight}>{branch}</span><span>{post_branch}</span></pre>
		<div bind:this={paramOptionHtml} class="param-option-wrapper">
			<ParamOptions
				parameter={parameter}
				optionsData={options}
			/>
		</div>
	{:else if (parameter && !segments)}
		<pre class="code-line"><span>{pre_branch}</span></pre>
	{:else}
		<pre class="code-line"><span>{pre_branch}</span></pre>
	{/if}
</div>

<style>
	.code-line-container {
		margin: 0 0 10px 0; /* 10px arbitrary */
	}
	pre.code-line {
		margin: 6px 0px;
		white-space: pre-wrap;
	}
	.param-option-wrapper {
		display: none;
	}
</style>