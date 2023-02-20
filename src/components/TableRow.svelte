<script>
    import { css } from "@emotion/css";


    export let row, width;
    let cell = css`
        min-width: ${width}px;
        width: ${width}px;
    `
</script>

<div class="table-row">
    {#each row as value}
        <div class="table-cell {cell}">{value}</div>
    {/each}
</div>

<style>
    .table-row {
        font-size: 11px;
        display: flex;
        flex-direction: row;
    }

    .table-cell {
        padding: 8px;
        border: 1px solid black;
        border-top: 0;
        white-space: initial;
        word-break: break-all;
    }

    .table-cell:not(:first-child) {
        border-left: 0;
    }
</style>