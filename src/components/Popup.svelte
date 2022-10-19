<script>
	import { onMount } from 'svelte';
    import { css } from '@emotion/css';
	import { header, nameContainer, gridNamesHeight } from '../utils/dimensions.js';
	import { colors } from '../utils/colorPallete.js';

    let infoPopup;

    export const popupBg = css`
        position:absolute;
        top:0;
        left:0;
        height:100vh;
        width:100vw;
        background-color:${colors.gray+"80"};
        z-index:3;
    `

    onMount(() => {
        let style = `
            position:absolute;
            top:${header.top+nameContainer.height+gridNamesHeight}px;
            left:${document.querySelector(".button-wrapper").offsetWidth+document.querySelector(".main").offsetWidth}px;
            width:175px;
            white-space:initial;
            background-color:${colors.gray};
            color:#F6F6F6;
            border-radius:0 10px 10px 10px;
        `;
        infoPopup.style = style;
    });
</script>

<div class={popupBg}>
    <div bind:this={infoPopup} id="info-popup">
        <p>
            Click on any rectangle to open a new window of the analysis document with the options of the selected row displayed.
        </p>
        <button onclick="(e=>e.parentElement.parentElement.remove())(this)">
            Close
        </button>
    </div>
</div>

<style>
    #info-popup > * {
        margin: 10px;
    }
</style>