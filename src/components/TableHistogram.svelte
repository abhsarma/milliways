<script>
	import { range, extent, max, histogram } from 'd3-array';
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { select, selectAll } from 'd3-selection';
	import { colors } from '../utils/colorPallete.js';
	import { validType } from '../utils/helpers/dataTableUtils';
	import { text } from '../utils/dimensions.js'

	// TODO: max/min-imize
	export let data, histHeight, histWidth;
	
	// removing and counting non-values
	let na = 0;
	// for (let i = 0; i < values.length; i++) {
	// 	if (
	// 		(data.field_type === "numeric" && typeof values[i] !== "number") ||
	// 		(data.field_type === "Date" && values[i] === null)
	// 	) {
	// 		values.splice(i, 1);
	// 		na++;
	// 		i--;
	// 	}
	// }

	// // this is done so that we can compare dates
	// if (data.field_type === "Date")
	// 	values = values.map(v => new Date(v));
	
	// // to be displayed below the histogram
	// let range = extent(values);

	// // convert back to string 
	// if (data.field_type === "Date")
	// 	range = range.map(date => date.toISOString().split('T')[0])

	let x = [...data.values];
	let uniqueValues = new Set(x).size;
	let tickCount = Math.min(uniqueValues, 10);
	let xDomain = uniqueValues < 20 ? extent(x).map((d, i) => Math.pow(-1, i+1)*0.5 + d) : extent(x);

	let xscale = scaleLinear()
		.domain(xDomain)
		.range([8, histWidth - 8]);	

	let hist = histogram()
		.value( d => d )
		.domain(xscale.domain())
		.thresholds(
			(data, min, max) => uniqueValues >= 20 ? xscale.ticks(20) : range(uniqueValues).map(t => min + (t / uniqueValues) * (max - min))
		);

	let bins = hist(x) // .filter( d => (d.x1 - d.x0) > 0);

	let yscale = scaleLinear()
		.domain([0, max(bins.map(d => d.length))])
		.range([0, histHeight]);

</script>

<div class="table-histogram">
	<!-- HISTOGRAM -->
	<svg height={histHeight} width={histWidth}>
		<g id="data-{data.field}">
			<g class="histogram">
				{#each bins as d,i}
					<rect 
						class="d3-histogram" 
						x="{xscale(d.x0)}" 
						y="{histHeight - yscale(d.length)}"
						width="{xscale(d.x1) - xscale(d.x0)}" 
						height="{yscale(d.length)}" 
						fill="{colors.vis}"
						stroke="#ffffff"
						paint-order="stroke"
						stroke-width="1"
					></rect>
				{/each}
			</g>
		</g>
	</svg>

	<!-- Displays the range of values in the histogram -->
	<div class="histogram-range">
		<p>{extent(x)[0]}</p>
		<p>{extent(x)[1]}</p>
	</div>

	<!-- Displays # of invalid values -->
	<!-- <div class="invalid-value-container">
		<p>invalid values: {na}</p>
	</div> -->
</div>

<style>
	.histogram-range {
		display: flex;
		justify-content: space-between;
	}

	p {
		font-size: 11px;
		font-family: 'Av-Nx', sans-serif;
		padding: 0;
		margin: 0;
	}
</style>