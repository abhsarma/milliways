<script>
	import { css } from "@emotion/css";
    import { createEventDispatcher } from "svelte";
	import TableHistogram from "./TableHistogram.svelte";
	import { onMount } from 'svelte';
	import Sort from './Sort.svelte'

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
	<!-- The entire 1st row of the table -->
	<div class="col-name-row">
	    {#each tableData as col,i}
			<!-- The top box of the column -->
			<div class="column-header">
				<!-- Contains contents -->
				<div class="table-title table-cell {cell}">
					<div class="title-top">

						<!-- TITLE/FIELD -->
						<b style="width: {width-24}px;">{col.field}</b>

						<!-- Button changing based on sorting state-->
						<Sort 
							i={i+1} 
							w={20}
							padding={0}
							bind:index={sortByIndex} 
							bind:order={sortAscending}
							on:setSortIndex = {(e) => {dispatch('setSortIndex', e.detail)} }
							on:changeSortDirection = {(e) => dispatch('changeSortDirection', e.detail)}
						/>

					</div>

					<!-- TYPE OF VALUES/FIELD NAME -->
					<i>{col.field_type}</i>
					
				</div>
			</div>
		{/each}
	</div>
	<!-- The entire 2nd row of the table (that contains the histograms)-->
	<div class="histogram-row">
		{#each tableData as col,i}
			{#if col.field_type === 'character'}
				<div class="column-header histogram-container table-cell {cell}">
					<p><span class="large">{new Set(col.values).size}</span><br/>unique values</p>
				</div>
			{:else}
				<div class="column-header histogram-container table-cell {cell}">
					<TableHistogram
						data={col}
						histHeight={width/3}
						histWidth={width}
					/>
				</div>
			{/if}
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
    }

	.column-header:not(:first-child) {
		border-left: 1px solid #efefef;
	}

	p {
		text-align: center;
		vertical-align: middle;
		font-family: 'Av-Nx', sans-serif;
		font-weight: 500;
	}

	span.large {
		font-size: 21px;
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
        overflow: auto;
    }

    b {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        font-family: 'Av-Nx', sans-serif;
    }

    i {
        font-family: 'Av-Nx', sans-serif;
    }
    
    .active_svg {
		background-color: var(--hoverColor);
		fill: white;
	}
</style>