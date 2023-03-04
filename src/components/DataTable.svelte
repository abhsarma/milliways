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
	export let tableData, cellWidth, h;

	let size = tableData[0].values.length;

	let rows = [];
	for (let i = 0; i < tableData[0].values.length; i++) {
		let row = [];
		for (let j = 0; j < tableData.length; j++) {
			row.push(tableData[j].values[i]);
		}
		rows.push(row);
	}
</script>

<div class="table" style="height:{h}px">
	<div class="table-label">
		<h4>Data</h4>
		<p>n: {size}</p>
	</div>
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

<style>

	.table-label {
		height: 32px;
		padding: 8px 12px
	}

	h4 {
		font-size: 18px;
		line-height: 32px;
		margin: 4px 0px 0px 0px;
		font-family: Avenir Next;
		color: var(--textColor);
		display: inline-block;
		position: absolute;
		left: 12px;
	}

	p {
		display: inline-block;
		font-size: 12px;
		position: absolute;
		right: 12px;
	}
	
	.table {
		border: 1px solid #efefef;
		border-radius: 8px;
		overflow: auto;
	}
</style>