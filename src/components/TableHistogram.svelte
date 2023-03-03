<script>
	import * as d3 from 'd3';
    import { colors } from '../utils/colorPallete.js';
    import { validType } from '../utils/helpers/dataTableUtils';

    // TODO: max/min-imize

    export let data, maxBins, histHeight, histWidth;

    let numUnique = new Set(data.values).size;
    const NUM_BINS = Math.min(numUnique, maxBins);

    // this will stay constant, so this is defined here
    const BAR_WIDTH = histWidth / NUM_BINS;

    // copied so that the original is certainly not modified
    let values = [...data.values];
    
    // removing and counting non-values
    let na = 0;
    for (let i = 0; i < values.length; i++) {
        if (!validType(values[i], data.field_type)) {
            values.splice(i, 1);
            na++;
            i--;
        }
    }

    // this is done so that we can compare dates
    if (data.field_type === "Date")
        values = values.map(v => new Date(v));
    
    // === [Math.min(values), Math.max(values)]
    let range = d3.extent(values);

    // explicitly define the range of values of each bin in histogram
    let thresholds = [];
    for (let i = 1; i < NUM_BINS; i++)
        thresholds.push(((range[1]-range[0]) * i/NUM_BINS) + Number(range[0]));

    // convert to string to be displayed
    if (data.field_type === "Date")
        range = range.map(date => date.toISOString().split('T')[0])

    let histogram = d3.histogram()
        .thresholds(thresholds);
    let bins = histogram(values);

    // this is to make all histograms use up all height given
    let maxLength = Math.max(...bins.map(d => d.length));

    let y = d3.scaleLinear()
        .domain([0, maxLength])
        .range([0, histHeight]);
</script>

<div class="table-histogram">

    <!-- HISTOGRAM -->
    <svg height={histHeight} width={histWidth}>
        <!-- 
            In width="{barWidth - x}" for some x,
            x essentially acts as padding between bars
        -->
        {#each bins as d,i}
        <rect 
            class="d3-histogram" 
            x="{BAR_WIDTH * i}" 
            y="{histHeight - y(d.length)}"
            width="{BAR_WIDTH - 0.5}" 
            height="{y(d.length)}" 
            fill="{colors.vis}"
        ></rect>
        {/each}
    </svg>

    <!-- Displays the range of values in the histogram -->
    <div class="histogram-range">
        <p>{range[0]}</p>
        <p>{range[1]}</p>
    </div>

    <!-- Displays # of invalid values -->
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