<script>
    import TableHeader from "./TableHeader.svelte";
    import TableRow from "./TableRow.svelte";

    /*
        The data should have this format:
        [
            {
                "field": <string>,
                "values": [<field_type>,...],
                "field_type": "nominal" | "ordinal" | "numeric" | "Date"
            },
            ...
        ]
        Each {} is a column.
    */
    export let tableData, cellWidth;

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
    <TableHeader
        tableData={tableData}
        width={cellWidth}
    />
    {#each rows as row}
        <TableRow
            row={row}
            width={cellWidth}
        />
    {/each}
</div>