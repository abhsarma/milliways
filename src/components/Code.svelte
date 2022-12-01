<script>
	import { css } from '@emotion/css';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import * as code from '../../static/data/code.json';
	import ParamOptions from './ParamOptions.svelte';
    import CodeLine from './CodeLine.svelte';

	// 80 for transparency
	export const highlight = css`
		background-color: ${colors.inactive+"80"};
		cursor: pointer;
    `;
    export const codeLine = css`margin: 0;`;

    document.documentElement.style.setProperty('--bgColor', colors.background)
</script>

<div class="code-container">
    <div class="code">
        <h2>CODE</h2>
        <!--TODO: passing the whole code.parameters is probably bad-->
        {#each code.code as line}
            <CodeLine line={line} optionsData={code.parameters} />
        {/each}
    </div>
</div>

<style>
	div.code-container {
		display: inline-flex;
		position: absolute;
		margin-left: 16px;
        margin-right: 16px;
        padding: 16px;
        background-color: var(--bgColor);
    }
</style>