<script>
	import { css } from "@emotion/css";
    import { createEventDispatcher } from "svelte";
	import TableHistogram from "./TableHistogram.svelte";
	import { onMount } from 'svelte';

    export let tableData, width
    export let sortAscending, sortByIndex; // see Table.svelte for details on these variables

	let cell = css`
		min-width: ${width}px;
		width: ${width}px;
	`;

    let dispatch = createEventDispatcher();

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
					<div class="title-top">
						<b style="width: {width-24}px;">{col.field}</b>
						{#if sortByIndex === i+1}
							{#if sortAscending === 1}
								<button class="histogram-button sort-btn" id="column-{i}" on:click={()=> dispatch("changeSortDirection")}>
									<svg class="active_svg" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>
								</button>
							{:else}
								<button class="histogram-button sort-btn" id="column-{i}" on:click={()=> {dispatch("changeSortDirection"); dispatch("setSortIndex", 0)}}>
									<svg class="active_svg" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>					
								</button>
							{/if}
						{:else}
							<button class="histogram-button sort-btn" id="column-{i}" on:click={() => dispatch("setSortIndex", i+1)}>
								<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/></svg>
							</button>
						{/if}
					</div>
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
        background-color: white;
        display: flex;
        flex-direction: column;
        align-content: space-between;
        border: 1px solid var(--gray20);
    }

	.column-header:not(:first-child) {
		border-left: 1px solid #efefef; /* 0 */
	}

    .table-title {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .title-top {
        display: flex;
        justify-content: space-between;
    }

    .table-cell {
        background-color: white;
        display: flex;
        flex-direction: column;
        padding: 8px;
    }

    .histogram-container {
        border-top: 1px solid var(--gray20);
        overflow: auto;
    }

    b {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .histogram-button {
		z-index: 2;
        margin: 0;
		padding: 0;
		border: 1px solid var(--bgColor);
		background-color: var(--bgColor);
		border-radius: 4px;
		align-content: center;
	}

    .histogram-button > svg {
        width: 18px;
        height: 18px;
    }

	.histogram-button:hover > svg {
		background-color: var(--hoverColor);
		fill: white;
	}
	.histogram-button:active > svg {
		background-color: var(--hoverColor);
		color: white;
	}
    
    .active_svg {
		background-color: var(--hoverColor);
		fill: white;
	}
</style>