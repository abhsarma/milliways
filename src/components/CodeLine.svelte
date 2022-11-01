<script>
	import { css } from '@emotion/css';
    import { onMount } from 'svelte';
	import { colors } from '../utils/colorPallete.js';
    import ParamOptions from "./ParamOptions.svelte";

    export let line;
    export let optionsData;
    
    let paramOptionHtml;
    let show = false;

    // 80 for transparency
    export const highlight = css`
        background-color: ${colors.inactive+"80"};
        cursor: pointer;
    `;

    /*
        NOTES:
        branchRegex:
        - it assumes the content in the parentheses is a valid R variable name
        - if "branch(...)" is preceded by any \w, i.e. [a-zA-Z0-9_], it will not match.
        paramRegex:
        - it just takes anything between 'branch(' and the first ')' afterwards
    */
    const branchRegex = /(\bbranch\(([a-zA-Z]|\.[a-zA-Z_.])[\w.]*\))/;
    const paramRegex  = /(?<=branch\().*?(?=\))/;

    // get param name of branch
    let param;
    try {
        param = line.match(paramRegex)[0];
    } catch (e) {
        param = undefined;
    }

    const newLine = line.replace(branchRegex,`<span class='highlight ${highlight} code-line-${param}'>$1</span>`);

    onMount(() => {
        if (param)
            document.querySelector(`.code-line-${param}`).addEventListener(
                'click',
                function() {
                    if (show) {
                        paramOptionHtml.style.display = 'none';
                        this.style.backgroundColor = colors.inactive+"80";
                    } else {
                        paramOptionHtml.style.display = 'block';
                        this.style.backgroundColor = colors.active+"80";
                    }
                    show = !show;
                }
            );
    });
</script>

<div class="code-line-container">
    <pre class="code-line">{@html newLine}</pre>
    {#if param}
        <div bind:this={paramOptionHtml} class="param-option-wrapper">
            <ParamOptions
                param={param}
                optionsData={optionsData[param]}
            />
        </div>
    {/if}
</div>

<style>
    .code-line-container {
        margin: 0 0 10px 0; /* 10px arbitrary */
    }
    .code-line {
        margin: 10px 0 0 0;
        white-space: pre-wrap;
    }
    .param-option-wrapper {
        display: none;
    }
</style>