<script>
	import TableHeader from "./TableHeader.svelte";
	import TableRow from "./TableRow.svelte";
    import { colors } from '../utils/colorPallete'
    import { validType } from '../utils/helpers/dataTableUtils';
    import Maximise from "./icons/maximise.svelte";
    import Minimise from "./icons/minimise.svelte";

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
	export let tableData, cellWidth, h;

    let maximised = false;

	let size = tableData[0].values.length;

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

    function changeSortDirection() {
        sortAscending *= -1;
    }

    function setSortIndex(event) {
        if (sortByIndex !== event.detail) {
            sortByIndex = event.detail;
            sortAscending = 1;
        }
    }

    function toggleSize() {
        maximised = !maximised;
        if (maximised) {
            document.querySelector('.table').classList.add('maximised-table');
            document.querySelector('.table-bg').classList.add('show');
        }
        else {
            document.querySelector('.table').classList.remove('maximised-table');
            document.querySelector('.table-bg').classList.remove('show');
        }
    }

    document.documentElement.style.setProperty('--gray20', colors.gray20);
</script>

<div class="table-bg"></div>
<div class="table" style="height:{h}px">
	<div class="table-label">
		<h4>Data</h4>
        <div class="label-right">
            <p id="dataset-size">n: {size}</p>
            <button class="toggle-button" on:click={toggleSize}>
                {#if maximised}
                    <Minimise h=18 w=18 fill="black" />
                {:else}
                    <Maximise h=18 w=18 fill="black" />
                {/if}
            </button>
        </div>
	</div>
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

<style>
	.table-label {
		height: 32px;
		padding: 8px 12px;
        justify-content: space-between;
        display: flex;
        flex-direction: row;
        background-color: white;
        position: sticky;
        left: 0px;
	}

    p#dataset-size {
        margin: 0px 24px;
        display: inline-block;
        font-size: 12px;
        font-family: 'Av-Nx', sans-serif;
    }

    .toggle-button {
        display: flex;
		align-items: center;
        justify-content: center;
		background-color: #ffffff;
        margin: 0;
        padding: 0;
		border: none;
		border-radius: 4px;
        height: 24px;
        width:  24px;
    }

    .toggle-button:hover {
        background-color: #efefef;
    }

    .label-right {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

	h4 {
		font-size: 18px;
		line-height: 32px;
		margin: 4px 0px 0px 0px;
		font-family: Av-Nx;
		color: var(--textColor);
		display: inline-block;
		/* position: absolute;
		left: 12px; */
	}
	
	.table {
		border: 1px solid #efefef;
		border-radius: 20px;
		overflow: auto;
	}

    :global(.maximised-table) {
        z-index: 99;
        position: fixed;
        height: calc(100% - 200px) !important;
        width: calc(100% - 200px);
        top: 100px;
        left: 100px;
        box-shadow: 2px 2px 4px 0px #cccccc;
    }

    :global(.maximised-table > *) {
        z-index: 99;
    }

    :global(.table-bg.show) {
        content: "";
		position: fixed;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		background-color: #efefef80;
		backdrop-filter: blur(3px);
		z-index: 20;
    }
</style>