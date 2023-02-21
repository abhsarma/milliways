<script>
	import { css } from "@emotion/css";
	import TableHistogram from "./TableHistogram.svelte";
	import { onMount } from 'svelte';

	export let tableData, width;

	let cell = css`
		min-width: ${width}px;
		width: ${width}px;
	`

	onMount(() => {
		let container = document.querySelector('div.table');
		let h = document.querySelector('div.table-label').getBoundingClientRect().height;

		container.addEventListener('scroll', function() {
			let scrollPosition = container.scrollTop;

			if (scrollPosition > h) {
				document.querySelector('div.table-header').classList.add('c--scrolled');
			} else {
				document.querySelector('div.table-header').classList.remove('c--scrolled');
			}
		});
	})
</script>

<div class="table-header">
	<div class="col-name-row">
	    {#each tableData as col,i}
			<div class="column-header">
				<div class="table-title table-cell {cell}">
					<b class="{cell}">{col.field}</b>
					<i>{col.field_type}</i>
				</div>
			</div>
		{/each}
	</div>
	<div class="histogram-row">
		{#each tableData as col,i}
			<div class="column-header" id="data-column-{i}">
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
</div>

<style>

	.table-header {
		display: flex;
		position: sticky;
		top: 0px;
		font-size: 12px;
		flex-direction: column;
		background-color: #ffffff;
		border-top: 1px solid #efefef;

		height: fit-content;
		width: fit-content;
	}

	:global(.c--scrolled) {
		box-shadow: #4f4f4f30 0px 4px 4px 0px, #4f4f4f30 0px 8px 12px 6px
	}

	.col-name-row {
		display: flex;
		flex-direction: row;
		border-bottom: 1px solid #efefef;
	}

	.histogram-row {
		display: flex;
		flex-direction: row;
		border-bottom: 1px solid #efefef;
	}

	.column-header {
		display: flex;
		flex-direction: column;
		align-content: space-between;
	}

	.column-header:not(:first-child) {
		border-left: 1px solid #efefef;
	}

	.table-cell {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}

	.histogram-container {
		overflow: auto;
/*        border-right: 1px solid #efefef;*/
	}

	b {
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
</style>