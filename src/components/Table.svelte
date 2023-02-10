<script>
    import TableHeader from "./TableHeader.svelte";
    import TableRow from "./TableRow.svelte";

    /*
        The data should have this format:
        [
            {
                "field": <string>,
                "values": [<field_type>,...],
                "field_type": <string>
            },
            ...
        ]
        Each {} is a column.
    */
    export let tableData;
    
    let headers = [];
    for (let d of tableData) headers.push({ field:d.field, field_type:d.field_type});

    let rows = [];
    for (let i = 0; i < tableData[0].values.length; i++) {
        let row = [];
        for (let j = 0; j < tableData.length; j++) {
            row.push(tableData[j].values[i]);
        }
        rows.push(row);
    }
</script>

<div class="table">
    <TableHeader headers={headers} />
    {#each rows as row}
        <TableRow row={row} />
    {/each}
</div>

<style>
    .table {
        border-collapse: collapse;
        overflow: scroll;
        /* height: 50%; */
    }
</style>