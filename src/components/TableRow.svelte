<script>
    export let row;
</script>

<div class="table-row">
    {#each row as value}
        <div class="table-cell">{value}</div>
    {/each}
</div>

<style>
    .table-row {
        font-size: 11px;
        display: flex;
        flex-direction: row;
    }

    .table-cell {
        min-width: 100px;
        width: 100px;
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