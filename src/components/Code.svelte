<script>
	import { css } from '@emotion/css';
	import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
	import ParamOptions from './ParamOptions.svelte';
    import CodeLine from './CodeLine.svelte';
    
    export let code;

    document.documentElement.style.setProperty('--bgColor', colors.background)
    document.documentElement.style.setProperty('--hoverColor', colors.hover)
</script>

<div class="code-container">
    <div class="code">
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
        border-radius: 8px;
    }
</style>