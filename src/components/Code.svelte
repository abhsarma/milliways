<script>
	import { css } from '@emotion/css';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import ParamOptions from './ParamOptions.svelte';
	import CodeLine from './CodeLine.svelte';
	
	export let code;
	
	const regexp = /(branch)/g;
	// if there's multiple matches of `branch` in a line, make sure they are split into separate lines:
	function splitMultipleBranches(code) {
		for (let i in code) {
			const branches = [...code[i].matchAll(regexp)];
			if (branches.length > 1) {
				// we need to split up this string into multiple lines
				// and then remove this element, and 
				// replace it with a list of strings;
				// adds indentation due to introduction of line breaks
				// code.splice(i, 1, code[i].split(/(?=branch)/).map(x => "  " + x))
				code.splice( i, 1, code[i].split(/(?=branch)/).map((x, i) => { if (i > 0) {return "  " + x} else {return x} }) )
			}
		}
		return code.flat()
	}

	let formattedCode = splitMultipleBranches(code.code);

	document.documentElement.style.setProperty('--bgColor', colors.background)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)
	document.documentElement.style.setProperty('--textColor', colors.text)

	function getParameter(line) {
		const paramRegex  = /(?<=branch\().*?(?=\))/;
		let param;

		try {
			param = line.match(paramRegex)[0];
		} catch (e) {
			param = undefined;
		}

		return param;
	}
</script>


<div class="code">
	<h4>Code</h4>
	{#each formattedCode as line}
		<CodeLine line={line} parameter={getParameter(line)} options={code.parameters[getParameter(line)]}  />
	{/each}
	<br>
</div>

<style>
	h4 {
		font-size: 18px;
		margin: 4px 0px 12px 0px;
		font-family: Av-Nx;
		color: var(--textColor);
	}

	div.code {
		padding: 16px;
		border: 1px solid #efefef;
	}
</style>
