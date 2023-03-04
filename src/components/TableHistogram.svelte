<script>
	import * as d3 from 'd3';
	import { colors } from '../utils/colorPallete.js';

	export let data, maxBins, histHeight, histWidth;

	let numUnique = new Set(data.values).size;
	let numBins = Math.min(numUnique, maxBins);

	let values = [...data.values];
	
	// removing and counting non-values
	let na = 0;
	for (let i = 0; i < values.length; i++) {
		if (
			(data.field_type === "numeric" && typeof values[i] !== "number") ||
			(data.field_type === "Date" && values[i] === null)
		) {
			values.splice(i, 1);
			na++;
			i--;
		}
	}

	// this is done so that we can compare dates
	if (data.field_type === "Date")
		values = values.map(v => new Date(v));
	
	// to be displayed below the histogram
	let range = d3.extent(values);

	// convert back to string 
	if (data.field_type === "Date")
		range = range.map(date => date.toISOString().split('T')[0])

	let x = d3.scaleLinear()
		.domain(d3.extent(values))
		.range([8, histWidth - 8]);

	let histogram = d3.histogram()
		.value(function(d) { return d; })   // I need to give the vector of value
		.domain(x.domain())
		.thresholds(x.ticks(5));

	let bins = histogram(values);

	// this is because sometimes, the 0th one is significantly smaller
	let widthIdx = bins.length === 1 ? 0 : 1

	// this is because the last bar is hidden and not all bars are the same width otherwise
	// numBins-1 / numBins is so that the bars don't overlap
	let barWidth = (x(bins[widthIdx].x1) - x(bins[widthIdx].x0)) * ((numBins-1)/numBins);

	// this is because the last bar is hidden
	// x = x.range([0, histWidth-barWidth]);

	// this is to make all histograms use up all height given
	let maxLength = 0;
	for (let d of bins) {
		maxLength = Math.max(maxLength, d.length);
	}
	
	let y = d3.scaleLinear()
		.domain([0, maxLength])
		.range([0, histHeight]);
</script>

<div class="table-histogram">
	<svg height={histHeight} width={histWidth}>
		{#each bins as d,i}
			<!-- {#if data.field == "depression"}
				{console.log(d, x(d.x0), x(d.x1))}
			{/if} -->
			<rect 
				class="d3-histogram" 
				x="{x(d.x0)}" 
				y="{histHeight - y(d.length)}"
				width="{x(d.x1) - x(d.x0)}" 
				height="{y(d.length)}" 
				fill="{colors.vis}"
			></rect>
		{/each}
	</svg>
	<div class="histogram-range">
		<p>{range[0]}</p>
		<p>{range[1]}</p>
	</div>
	<div class="invalid-value-container">
		<p>invalid values: {na}</p>
	</div>
</div>

<style>
	.histogram-range {
		display: flex;
		justify-content: space-between;
	}

	p {
		font-size: 11px;
		padding: 0;
		margin: 0;
	}
</style>