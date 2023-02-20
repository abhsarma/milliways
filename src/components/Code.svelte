<script>
	import { css } from '@emotion/css';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import ParamOptions from './ParamOptions.svelte';
	import CodeLine from './CodeLine.svelte';
	
	export let code;

	document.documentElement.style.setProperty('--bgColor', colors.background)
	document.documentElement.style.setProperty('--hoverColor', colors.hover)

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
	{#each code.code as line}
		<CodeLine line={line} parameter={getParameter(line)} options={code.parameters[getParameter(line)]}  />
	{/each}
</div>