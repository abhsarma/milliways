<script>
    import TableHeader from "./TableHeader.svelte";
    import TableRow from "./TableRow.svelte";
    import { colors } from '../utils/colorPallete'

    /*
        The data should have this format:
        [
            {
                "field": <string>,
                "values": [<element of field_type>,...],
                "field_type": "nominal" | "ordinal" | "numeric" | "Date"
            },
            ...
        ]
        Each {} is a column.
    */
    export let tableData, cellWidth;

    /*
        sortByIndex refers to which column to sort by, starting with 1, not 0.
        e.g. the first column will be referred to as 1, not 0.
    */
    $: sortByIndex = 0;
    $: sortAscending = 1; // 1 if ascending, -1 if descending

    let rows = [];
    for (let i = 0; i < tableData[0].values.length; i++) {
        let row = [];
        for (let j = 0; j < tableData.length; j++) {
            row.push(tableData[j].values[i]);
        }
        rows.push(row);
    }

    /* 
        This stores the indexes of `rows` sorted in order based on the `sortByIndex`-th column

        sortByIndex===0 => rowIdxs[sortByIndex] is the unsorted version i.e. [0,1,2,...,rows.length-1]
        sortByIndex>0   => rowIdxs[sortByIndex] is idxs of elements of `rows` sorted ascending
        sortByIndex<0   => ... descending

        I did this bc I wanted sorting to be handled quickly and storing the rows directly would be largeish
    */
    let rowIdxs = [[]];

    // this will be used to calculate how the rows will be sorted
    let rowsToSort = [];

    // populate rowsToSort, populate rowIdxs[0]
    for (let i = 0; i < rows.length; i++) {
        rowsToSort.push([rows[i], i]);
        rowIdxs[0].push(i);
    }

    // populate rest of rowIdxs
    for (let i = 0; i < tableData.length; i++) {
        let fieldType = tableData[i].field_type;
        rowsToSort.sort((a,b) => {
            let x = a[0][i],
                y = b[0][i];
            let xValid = validType(x, fieldType),
                yValid = validType(y, fieldType);

            // invalid values go last
            if (xValid && !yValid) return -1;
            if (!xValid && yValid) return 1;

            if (x < y) return -1;
            if (x > y) return 1;

            // if equal, sort by original order
            return a[1] < b[1] ? -1 : 1;
        });
        let idxs = rowsToSort.map(x => x[1]);
        rowIdxs.push(idxs);

        // -rowIdxs.length+1 will be negative! 
        rowIdxs[-rowIdxs.length+1] = [...idxs].reverse();
    }

    function validType(val, fieldType) {
        return (fieldType === "numeric" && typeof val === "number") ||
               (fieldType === "Date" && val !== null);
    }

    function changeSortDirection() {
        sortAscending *= -1;
    }

    function setSortIndex(event) {
        if (sortByIndex !== event.detail) {
            sortByIndex = event.detail;
            sortAscending = 1;
        }
    }

    document.documentElement.style.setProperty('--gray20', colors.gray20);
</script>

<div class="table">
    <TableHeader
        tableData={tableData}
        width={cellWidth}
        bind:sortAscending={sortAscending}
        bind:sortByIndex={sortByIndex}
        on:changeSortDirection={changeSortDirection}
        on:setSortIndex={setSortIndex}
    />
    {#each rowIdxs[sortAscending*sortByIndex] as i}
        <TableRow
            row={rows[i]}
            width={cellWidth}
        />
    {/each}
</div>