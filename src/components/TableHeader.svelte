<script>
    import { css } from "@emotion/css";
    import TableHistogram from "./TableHistogram.svelte";

    export let tableData, width;

    let cell = css`
        min-width: ${width}px;
        width: ${width}px;
    `
</script>

<div class="table-header">
    {#each tableData as col,i}
        <div class="column-header" id="data-column-{i}">
            <div class="table-title table-cell {cell}">
                <b class="{cell}">{col.field}</b>
                <i>{col.field_type}</i>
            </div>
            <div class="histogram-container table-cell {cell}">
                <TableHistogram
                    data={col}
                    maxBins=20
                    histHeight={width/3}
                    histWidth={width}
                />
            </div>
        </div>
    {/each}
</div>

<style>
    .table-header {
        position: sticky;
        top: 0px;
        font-size: 14px;
        display: flex;
        flex-direction: row;
		z-index: 10;
    }

    .column-header {
        background-color: white;
		box-shadow: 0px 4px 5px -2px #c0c0c0;
        display: flex;
        flex-direction: column;
        align-content: space-between;
        border: 1px solid black;
    }

    .column-header:not(:first-child) {
        border-left: 0;
    }

    .table-cell {
        display: flex;
        flex-direction: column;
        padding: 8px;
    }

    .histogram-container {
        border-top: 1px solid black;
        overflow: auto;
    }

    b {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
</style>