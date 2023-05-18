<script>
	import { css } from '@emotion/css';
	import { colors } from '../utils/colorPallete.js';
    export let parameter;
    export let optionsData;

    const optionsContainer = css`
        background-color: ${colors.inactive+"80"};
        margin: 5px;
        padding: 5px;
        border-radius: 5px;
    `

    const paramOption = css`
        margin-bottom: 12px;
    `

    const optionName = css`
        font-size: 14px;
        font-family: "Av-Nx";
        font-weight: 700;
        cursor: default;
    `

    let options = [];

    for (let optionData of optionsData) {
        let option = { name:"", content:"" };
        let index = optionData.indexOf('"',1); // assumed to exist
        option.name = optionData.slice(1,index);
        index = optionData.indexOf('~'); // also assumed to exist
        option.content = optionData.slice(index+2);
        options.push(option);
    }
</script>

<div class="options-container {optionsContainer}" id="paramOptions-{parameter}">
    {#each options as { name, content }, i }
        <div class="param-option {paramOption}" id="{parameter}-{i}">
            <p class={optionName}>{name}</p>
            <code>{content}</code>
        </div>
    {/each}
</div>

<style>
    .options-container {
        margin-bottom: 10px;
    }
    div.param-option > p {
        margin: 0;
    }
    div.param-option > code {
        white-space: pre-wrap;
    }
</style>