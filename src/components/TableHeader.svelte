<script>
    export let headers;
</script>

<div class="table-header">
    {#each headers as header}
        <div class="table-cell">
            <b>{header.field}</b>
            <i>{header.field_type}</i>
        </div>
    {/each}
</div>

<style>
    .table-header {
    position: relative;
        position: sticky;
        top: 0;
        background-color: white;
        font-size: 14px;
        display: flex;
        flex-direction: row;
    }

    .table-cell {
        min-width: 100px;
        width: 100px;
        display: flex;
        flex-direction: column;
        padding: 8px;
        border: 1px solid black;
    }

    .table-cell:not(:first-child) {
        border-left: 0;
    }

    b {
        white-space: initial;
        word-break: break-all;
    }
</style>