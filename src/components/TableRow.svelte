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
		font-family: 'Av-Nx', sans-serif;
		display: flex;
		flex-direction: row;
		border-bottom: 1px solid #efefef;
		height: fit-content;
		width: fit-content;
		background-color: white;
	}

    .table-cell {
        padding: 8px;
        border-top: 0;
        white-space: initial;
        word-break: break-all;
    }

	.table-cell:not(:first-child) {
		border-left: 1px solid #efefef;
	}
</style>