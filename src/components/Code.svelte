<script>
	import { css } from '@emotion/css';
    import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
    import * as code from '../../static/data/code.json';
    import ParamOptions from './ParamOptions.svelte';

    // 80 for transparency
    export const highlight = css`
        background-color: ${colors.inactive+"80"};
        cursor: pointer;

    `;
    export const codeLine = css`margin: 0;`;

    /*
        NOTES ABOUT THE REGEX:
        - it assumes the content in the parentheses is a valid R variable name
        - if "branch(...)" is preceded by any \w, i.e. [a-zA-Z0-9_], it will not match.
    */
    const branchRegex = /(\bbranch\(([a-zA-Z]|\.[a-zA-Z_.])[\w.]*\))/;
    const codeHTML = 
        code.code.map(line => 
            line.replace(
                branchRegex,
                `<span class='highlight ${highlight}'>$1</span>`
        ));

    $: displayParams = [];

    function branchOnClick() {
        const currBranch = this.textContent.match(/(?<=\().*(?=\))/)[0]; // get branch name
        const index = displayParams.indexOf(currBranch);
        if (index !== -1) {
            displayParams.splice(index, 1);
            this.style.backgroundColor = colors.inactive+"80";
        }
        else {
            displayParams.push(currBranch);
            this.style.backgroundColor = colors.active+"80";
        }
        displayParams = displayParams;
    }
    
    onMount(() => {
        document.querySelectorAll('.highlight').forEach(el => el.addEventListener('click', branchOnClick));
    });
</script>

<div class="code-container">
    <div class="code">
        <h2>CODE</h2>
        {#each codeHTML as line}
            <pre class="code-line {codeLine}">{@html line}</pre>
        {/each}
    </div>
    <div class="param-options-container">
        {#each displayParams as param (param)}
            <ParamOptions
                param={param}
                optionsData={code.parameters[param]}
            />
        {/each}
    </div>
</div>

<style>
    div.code-container {
		display: inline-flex;
		position: absolute;
		margin-left: 16px;
    }
    
    div.param-options-container {
		margin-left: 16px;
    }
</style>