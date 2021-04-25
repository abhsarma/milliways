import { css, cx } from '@emotion/css'
import * as d3 from 'd3';
import { cell, groupPadding, margin, outVisWidth, h1, text, namingDim } from './dimensions.js'
import Tooltip from './tooltip-parameter-menu.svelte'
import Dropdown from './dropdown-menu.svelte'
import { state } from './stores.js';

const header_size = h1;
const text_size = text;
let selected_options = [];

let state_value;

const unsubscribe = state.subscribe(value => {
	state_value = value;
});


function handleMouseenter(event, d) {
	d3.select("div.tooltip-menu." + d).transition()
		.duration(0.3)
		.delay(500)
		.style("visibility", "visible")
}

function handleMouseleave(event, d) {
	d3.select("div.tooltip-menu." + d).transition()
		.duration(0.3)
		.delay(500)
		.style("visibility", "hidden")
}

function handleSelection(event, d) {
	if (event.metaKey) {
		if (!selected_options.includes(d)) { 
			selected_options.push(d)
			d3.select(this).attr("class", option_names + " " + selected)
		} else {
			let index = selected_options.indexOf(d);
			if (index > -1) {
				selected_options.splice(index, 1);
			}
			d3.select(this).attr("class", option_names)
		}
	}
}

export const parameters = css`
	font-size: ${header_size + "px"};
	font-family: 'Avenir Next';
	text-transform: uppercase;
	padding: 0px ${cell.padding/2 + "px"};
	cursor: default;
	overflow: hidden;
	text-overflow: ellipsis;
	text-align: center;
	width: 100%;
`;

export const option_names = css`
	font-size: ${header_size + "px"};
	font-family: 'Avenir Next';
	line-height: ${cell.width}px;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: default;
	height: 100%;
	width: ${cell.width}px;
	writing-mode: tb-rl; 
	transform: rotate(-180deg);
`;

export const selected = css`
	font-weight: 700;
`;

export const options_container = css`
	fill: #ABB7C4;
`;

export const selected_option = css`
	fill: #FF602B;
`;

class multiverseMatrix {
	constructor (dat) {		
		// data for the plot constructor
		this.data = dat;

		// meta data for the multiverse object
		this.universes = [...new Set(dat.map(d => d['.universe']))];
		this.size = this.universes.length;
	}

	parameters() {
		// get the parameters from the first row as this is a rectangular dataset
		// is there a better way to do this?
		let param_names = Object.keys(this.data[0]['.parameter_assignment'])

		let dat = this.data.map(function(d) { 
			return Object.assign( {}, ...param_names.map((i) => ({[i]: d[i]})) );
		});

		return Object.assign( {}, ...param_names.map( (x) => ({[x]: d3.groups(dat, d => d[x]).map( i => i[0] )}) ) );
	}

	outcome_vars() {
		// get the variables from the results in first row as this is a rectangular dataset
		// is there a better way to do this?
		return this.data[0]["results"].map(i => i["term"]);
	}

	// creates the data structure for the grid matrix
	// we will draw this plot as a bar chart
	// input: JSON multiverse object (this.data), parameters (this.parameters)
	// output: rectangular data structure with columns corresponding to each parameter, 
	// 		   estimate, conf.low (if applicable), conf.high (if applicable)
	prepareGridData(term = null) {
		// creating a shallow copy which is fine for here
		let select_vars = [...Object.keys(this.parameters())];

		if (term == null) {
			term = this.outcome_vars()[0];
		}

		let gridData = this.data.map(function(d) { 
			let options = Object.assign({}, ...select_vars.map((i) => ({[i]: d[i]})));
			let outcomes = Object.assign({}, ...d["results"].filter(i => i.term == term).map(
					i => Object.assign({}, ...["estimate", "conf.low", "conf.high"].map((j) => ({[j]: i[j]})))
				))
			return Object.assign({}, options, outcomes);
		});

		return gridData;
	}

	// function for sorting the gridMatrix
	// sorts by each decision as well as by outcome metric
	// sort(order) {
		
	// }

	// // function from drawing the decision grid
	drawGrid (data, elem, xscale, yscale, margin) {
		// check if the number of terms visualised is the same as the number of universes
		if (data.length != this.size) {
			throw 'number of terms not equal to the number of universes universes!';
		}

		let params = this.parameters();

		this.drawHeaders(params, xscale, elem, margin);
		Object.keys(params).forEach( 
			(d, i) => this.drawColumn(data, params, i, elem, xscale, yscale) 
		);
	}

	drawHeaders(params, xscale, grid_plot, margin) {
		let options = Object.values(params);
		let col_idx = [0, ...options.map(d => d.length).map((sum => value => sum += value)(0))];

		let param_names = grid_plot.append("g")
			.attr("transform", (d, i) => `translate(${groupPadding}, 0)`)
			.attr("text-anchor", "middle")
			.selectAll("text")
			.data(Object.keys(params))
			.join("foreignObject")
			.attr("x", (d, i) => i == 0 ? 0 : groupPadding*i + col_idx[i]*(cell.width+cell.padding) - (i-1)*cell.padding )
			.attr("y", 4)
			.attr("width", (d, i) => (cell.width + cell.padding/2) * options.map(d => d.length)[i] )
			.attr("height", cell.height + 40 + "px")
			.append("xhtml:div")
			.attr("class", d => parameters + " parameter-name " + d.replace(/ /g, "_") )
			.text(d => d)
			.on("mouseover", handleMouseenter)
			.on("mouseout", handleMouseleave);

		param_names.each(function(d, i) {
			let node = d3.select("div.grid").node();
			let xpos = (i == 0) ? 0 : groupPadding*i + col_idx[i]*(cell.width+cell.padding) - (i-1)*cell.padding;
			let w = (cell.width + cell.padding/2) * options.map(d => d.length)[i]

			new Tooltip({ 
				target: node,
				props: {
					parameter: d,
					xpos: xpos,
					parent_width: w
				}
			});
		})
	}

	drawColumn(data, params, col, grid_plot, xscale, yscale) {
		let param = Object.keys(params)[col];
		let options = Object.values(params);
		let col_idx = [0, ...options.map(d => d.length).map((sum => value => sum += value)(0))];
		let colWidth = options.map(d => d.length)[col] * (cell.width + cell.padding);
		let ypos;

		if (state_value == 0) {
			ypos = 0;
		} else {
			ypos = namingDim + cell.padding;
		}

		xscale.domain(d3.range(options.map(d => d.length)[col]))
			.range( [0, colWidth] );

		let optionNames = grid_plot.append("g")
			.attr("class", "option-name")
			.attr( "transform",`translate(
				${col == 0 ? groupPadding : groupPadding*(col+1) + col_idx[col]*(cell.width+cell.padding) - (col-1)*cell.padding}, 
				${yscale(0)})`)
			.attr("text-anchor", "end")
			.selectAll("text")
			.data(options[col])
			.join("foreignObject")
			.attr("width", cell.width + cell.padding + "px" )
			.attr("height", namingDim + "px")
			.attr("x", (d, i) => xscale(i) )
			.append("xhtml:div")
			.attr("class", option_names)
			.text(d => d)
			.on("click", handleSelection);

		let optionCell = grid_plot.append("g")
			.attr("class", "option-value")
			.attr("transform",  `translate(
				${col == 0 ? groupPadding : groupPadding*(col+1) + col_idx[col]*(cell.width+cell.padding) - (col-1)*cell.padding}, 
				${ypos})`)
			.selectAll("g")
			.data(data)
			.join("g")
			.attr("transform", (d, i) => `translate(0, ${yscale(i)})`)
			.attr("class", (d, i) => `${d[param]} ${i}`)

		optionCell.selectAll("rect")
			.data(options[col])
			.join("rect")
			.attr("x", (d, i) => xscale(i) )
			.attr("width", cell.width)
			.attr("height", yscale.bandwidth())
			.attr("class", function(d, i) {
				let parent_class = d3.select(this.parentNode).attr("class").split(' ')[0];
				if (parent_class == d) {
					return `${options_container} ${selected_option} ${d} ${i}`
				}
				return `${options_container} ${d} ${i}`
			});
	}

	drawResults (data, elem, yscale) {
		const height = this.size * (cell.height + cell.padding); // to fix as D3 calculates padding automatically
		const width = this.parameters().length * (cell.width + cell.padding); // to fix
		let ypos;

		d3.select("g.outcomePanel").remove();


		let xscale = d3.scaleLinear()
			.domain(d3.extent(data.map(d => d["conf.low"]).concat(data.map(d => d["conf.high"]), 0)))
			.range([margin.left, outVisWidth + margin.left]);

		if (state_value == 0) {
			ypos = 0;
		} else {
			ypos = namingDim + cell.padding;
		}

		let outcomePlot = elem.append("g")
			.attr("class", "outcomePanel")
			.attr( "transform",
				`translate(0,  ${ypos})`)

		outcomePlot.append("line")
			.attr("class", "zero-line")
			.attr("x1", xscale(0) )
			.attr("y1", margin.top)
			.attr("x2", xscale(0) )
			.attr("y2", height - margin.bottom)
			.attr("stroke", "#d0d0d0")
			.attr("stroke-width", 2);

		// add a group for each universe
		let panelPlot = outcomePlot.selectAll("g")
			.data(data)
			.enter()
			.append("g")
			.attr("class", "universe");

		// Add reference lines
		panelPlot.append("line")
			.attr("class", "pointrange")
			.attr("x1", xscale.range()[0] )
			.attr("y1", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
			.attr("x2", xscale.range()[1] )
			.attr("y2", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
			.attr("stroke", "#e0e0e0")
			.attr("stroke-width", 1);

		// Add interval lines
		panelPlot.append("line")
			.attr("class", "pointrange")
			.attr("x1", d => xscale(d['conf.low']) )
			.attr("y1", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
			.attr("x2", d => xscale(d['conf.high']) )
			.attr("y2", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
			.attr("stroke", "#333333")
			.attr("stroke-width", 2);

		// Add point estimates
		panelPlot.append("circle")
			.attr("class", "mean")
			.attr("cx", d => xscale(d['estimate']))
			.attr("cy", (d, i) => yscale(i) + yscale.bandwidth() / 2)
			.attr("r", 4)
			.attr("fill", "#333333");
	}
}

export default multiverseMatrix