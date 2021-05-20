import { css, cx } from '@emotion/css'
import * as d3 from 'd3';
import { cell, nameContainer, iconSize, groupPadding, margin, outVisWidth, header1, namingDim } from './dimensions.js'
import Tooltip from './tooltip-parameter-menu.svelte'
// import OptionTooltip from './tooltip-option-menu.svelte'
import Dropdown from './dropdown-menu.svelte'
import OptionToggle from './toggle-hide-option.svelte'
import OptionJoin from './toggle-join-option.svelte'
import { state, selected, multi_param } from './stores.js';

// CSS Styles
export const parameters = css`
	font-size: ${header1.size + "px"};
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
	font-size: ${header1.size + "px"};
	font-family: 'Avenir Next';
	line-height: ${cell.width}px;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: default;
	height: ${nameContainer.height}px;
	width: ${nameContainer.width}px;
	writing-mode: tb-rl; 
	transform: rotate(-180deg);
`;

export const selected_style = css`
	font-weight: 700;
`;

export const options_container = css`
	fill: #ABB7C4;
`;

export const selected_option = css`
	fill: #FF602B;
`;

// Stores
let state_value;
let selected_value;
let selected_parameters;
state.subscribe(value => {
	state_value = value;
});
selected.subscribe(value => {
	selected_value = value;
});
multi_param.subscribe(value => {
	selected_parameters = value;
});

// global variables to store changes from interactions
let options_to_exclude = [];
let options_to_join = [];
// let option_xpos = [0];

// Event handler functions 
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

// Initialise UI items
export function drawResultsMenu(m, vis_node, grid_node, y, x) {
	const menu = new Dropdown({ 
		target: vis_node.node(),
		props: {
			items: m.outcome_vars()
		}
	});

	// update data when different option is selected using dropdown 
	menu.$on("message", event => {
		m.changeOutcomeVar(event.detail.text);
		m.prepareOutcomeData();

		m.update(options_to_exclude, vis_node, grid_node, y, x);
	})
}

class multiverseMatrix {
	constructor (dat) {		
		// data for the plot constructor
		this.data = dat;

		// meta data for the multiverse object
		this.universes = [...new Set(dat.map(d => d['.universe']))];
		this.size = this.universes.length;
		this.outcomeVar = dat[0]["results"].map(i => i["term"])[0]; // selects the first of the outcome vars
		this.gridData = null;
		this.outcomeData = null;
		this.exclude = []
	}

	changeOutcomeVar(term) {
		this.outcomeVar = term;
	}

	parameters() {
		// get the parameters from the first row as this is a rectangular dataset
		// is there a better way to do this?
		let param_names = Object.keys(this.data[0]['.parameter_assignment'])

		let dat = this.data.map(function(d) { 
			// console.log( Object.assign( {}, ...param_names.map((i) => ({[i]: d[i]})) ) );	
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
	prepareData() {
		let parameters = [...Object.keys(this.parameters())];
		options_to_exclude = Object.assign({}, ...parameters.map((i) => ({[i]: []})));
		options_to_join = Object.assign({}, ...parameters.map((i) => ({[i]: []})));

		this.prepareGridData();
		this.prepareOutcomeData();
	}

	prepareGridData(exclude = []) {
		// creating a shallow copy which is fine for here
		let parameters = [...Object.keys(this.parameters())];
		this.gridData = this.data.map( d => Object.assign({}, ...parameters.map((i) => ({[i]: [d[i]]}))) );
	}

	prepareOutcomeData(exclude = []) {
		// creating a shallow copy which is fine for here
		let term = this.outcomeVar;

		this.outcomeData = this.data.map(function(d) { 
			return Object.assign({}, ...d["results"].filter(i => i.term == term).map(
				i => Object.assign({}, ...["estimate", "conf.low", "conf.high"].map((j) => ({[j]: i[j]})))
			))
		});
	}

	joinData(toJoin = [], selected_options = []) {
		let gridData = this.gridData;
		let	outcomeData = this.outcomeData;

		let combine = Object.entries(toJoin)
					.map( d => Object.assign({}, ({parameter: d[0], options: d[1], replace: d[1][0]})) )
					.filter( d => (d['options'].length > 0) );

					//	Object.entries(toJoin)
					// .map( d => d[1].map( j => [d[0], j]) )
					// .flat(1)
					// .map( i => ({"parameter": i[0], "option": i[1]}) );

		let exclude = Object.entries(toJoin)
						.map( d => d[1].map( j => [d[0], j])
									.filter((i, n) => (n > 0)))
						.flat(1)
						.map( i => ({"parameter": i[0], "option": i[1]}) );

		if (exclude.length > 0) {
			// this means combine is also length > 0;
			let toFilter = this.gridData.map(j => exclude.map(i => j[i['parameter']] != i['option']).reduce((a, b) => (a && b)));
			gridData = this.gridData.filter( (i, n) => toFilter[n] )
						.map((d, i) => 
							combine.map(function (j) {
								if (d[j['parameter']] == j['replace']) {
									d[j['parameter']] = j['options']
								}
								return d
							}).reduce((a, b) => b)
						);
			outcomeData = this.outcomeData.filter( (i, n) => toFilter[n] );
		}
		console.log(gridData);
		// use this updated gridData to draw the join
		// most likely have to change the implementation of the class assigned to each <g>
	}

	// function for sorting the gridMatrix
	// sorts by each decision as well as by outcome metric
	// sort(order) {
		
	// }

	draw (selected_options = [], results_node, grid_node, y, x1, x2 = null) {
		let gridData = this.gridData;
		let	outcomeData = this.outcomeData;

		let exclude = Object.entries(selected_options)
					.map( d => d[1].map( j => [d[0], j]) )
					.flat(1)
					.map( i => ({"parameter": i[0], "option": i[1]}) );

		if (exclude.length > 0) {
			let toFilter = this.gridData.map(j => exclude.map(i => j[i['parameter']] != i['option']).reduce((a, b) => (a && b)));
			gridData = this.gridData.filter( (i, n) => toFilter[n] );
			outcomeData = this.outcomeData.filter( (i, n) => toFilter[n] );
		} else {
			gridData = this.gridData;
			outcomeData = this.outcomeData;
		}

		// update grid
		this.drawGrid(gridData, results_node, grid_node, y, x1);

		// update results
		this.drawResults(outcomeData, results_node, grid_node, y);
	}

	update (selected_options = [], results_node, grid_node, y, x1, x2 = null) {
		let gridData;
		let outcomeData;
		let results_container = results_node.select("svg");
		let grid_container = grid_node.select("svg");
		let params = this.parameters();

		let exclude = Object.entries(selected_options)
					.map( d => d[1].map( j => [d[0], j]) )
					.flat(1)
					.map( i => ({"parameter": i[0], "option": i[1]}) );

		console.log(exclude);

		// first exclude points from data
		if (exclude.length > 0) {
			let toFilter = this.gridData.map(j => exclude.map(i => j[i['parameter']] != i['option']).reduce((a, b) => (a && b)));
			gridData = this.gridData.filter( (i, n) => toFilter[n] );
			outcomeData = this.outcomeData.filter( (i, n) => toFilter[n] );
		} else {
			gridData = this.gridData;
			outcomeData = this.outcomeData;
		}

		// console.log(gridData);

		// update grid
		d3.selectAll("g.option-value").remove();		
		Object.keys(params).forEach( 
			(d, i) => this.drawColOptions(gridData, params, i, results_node, grid_node, y, x1)
		);

		// update results
		this.drawResults(outcomeData, results_node, grid_node, y);
	}

	// // function from drawing the decision grid
	drawGrid (data, results_node, grid_node, yscale, xscale) {
		let params = this.parameters();

		d3.selectAll("g.option-value").remove();
		d3.selectAll("g.option-name").remove();

		this.drawHeaders(params, xscale, results_node, grid_node, margin);
		Object.keys(params).forEach( 
			(d, i) => {
				this.drawColNames(data, params, i, results_node, grid_node, yscale, xscale);
				this.drawColOptions(data, params, i, results_node, grid_node, yscale, xscale);
		});
	}

	drawHeaders(params, xscale, results_node, grid_node, margin) {
		let plot = grid_node.select("svg");

		let options = Object.values(params);
		let col_idx = [0, ...options.map(d => d.length).map((sum => value => sum += value)(0))];

		let param_names = plot.append("g")
			.attr("transform", (d, i) => `translate(${groupPadding}, 0)`)
			.attr("text-anchor", "middle")
			.selectAll("text")
			.data(Object.keys(params))
			.join("foreignObject")
			.attr("x", (d, i) => i == 0 ? 0 : groupPadding*i + col_idx[i]*(cell.width+cell.padding) - (i-1)*cell.padding )
			.attr("y", 4)
			.attr("width", (d, i) => (cell.width + cell.padding/2) * options.map(d => d.length)[i] )
			.attr("height", cell.height + "px")
			.append("xhtml:div")
			.attr("class", d => parameters + " parameter-name " + d.replace(/ /g, "_") )
			.text(d => d)
			.on("mouseover", handleMouseenter)
			.on("mouseout", handleMouseleave);

		param_names.each(function(d, i) {
			let node = d3.select("div.grid").node();
			let xpos = (i == 0) ? 0 : groupPadding*i + col_idx[i]*(cell.width+cell.padding) - (i-1)*cell.padding;
			let w = (cell.width + cell.padding/2) * options.map(d => d.length)[i]
		})
	}

	drawColNames(data, params, col, results_node, grid_node, yscale, xscale) {
		let plot = grid_node.select("svg");
		let param = Object.keys(params)[col];
		let options = Object.values(params);
		let col_idx = [0, ...options.map(d => d.length).map((sum => value => sum += value)(0))];
		let colWidth = options.map(d => d.length)[col] * (cell.width + cell.padding);
		let ypos;
		let m = this;

		if (state_value == 0) {
			ypos = 4 * cell.padding;
		} else {
			ypos = namingDim + 4 * cell.padding;
		}

		xscale.domain(d3.range(options.map(d => d.length)[col]))
			.range( [0, colWidth] );

		let optionContainer = plot.append("g")
			.attr("class", "option-name")
			.attr( "transform",`translate(
				${col == 0 ? groupPadding : groupPadding*(col+1) + col_idx[col]*(cell.width+cell.padding) - (col-1)*cell.padding}, 
				${yscale(0)})`)
			.attr("text-anchor", "end")

		optionContainer.selectAll("text")
			.data(options[col].slice(0, -1))
			.join("foreignObject")
			.attr("width", 2*iconSize + "px" )
			.attr("height", 2*iconSize + "px")
			.attr("x", (d, i) => (xscale(i) + xscale(i+1))/2)
			.each(function(d, i) {
				let node = d3.select(this).node();

				const optionJoin = new OptionJoin({ 
					target: node
				})

				optionJoin.$on('message', event => {
					if (event.detail.text) {
						let temp = options_to_join[param].concat([options[col][i], options[col][i+1]]);
						options_to_join[param] = [...new Set(temp)];
					} else {
						// when removing, we can remove (i+1)-th option
						// if (i-1)-th option is in the array, we cannot remove i-th option
						// else we can
						let index1 = options_to_join[param].indexOf(options[col][i-1]);
						let index2 = options_to_join[param].indexOf(options[col][i]);
						if (index1 == -1 || i == 0) { // we can remove i-th option
							options_to_join[param].splice(index2, 1);
						}

						let index3 = options_to_join[param].indexOf(options[col][i+1]);
						if (index3 > -1) {
							options_to_join[param].splice(index3, 1);
						} else {
							console.log("error option index not found");
						}
					}

					m.joinData(options_to_join);
				})
			});

		let optionNames = optionContainer.selectAll("text")
			.data(options[col])
			.join("foreignObject")
			.attr("width", cell.width + cell.padding + "px" )
			.attr("height", namingDim + "px")
			.attr("x", (d, i) => xscale(i) )
			.attr("y", iconSize + cell.padding + "px")
			.attr("class", (d, i) => `${d}`)

		optionNames.each(function(d, i) {
				let node = d3.select(`foreignObject.${d}`).node();

				const optionSwitch = new OptionToggle({ 
					target: node,
					props: {
						option: d
					}
				});

				optionSwitch.$on('message', event => {
					if (!event.detail.text) {
						options_to_exclude[param].push(d)
					} else {
						let index = options_to_exclude[param].indexOf(d);
						if (index > -1) {
							options_to_exclude[param].splice(index, 1);
						} else {
							console.log("error option index not found");
						}
					}
					m.update(options_to_exclude, results_node, grid_node, yscale, xscale)
				})
			})

		optionNames.append("xhtml:div")
			.attr("class", (d, i) => `${option_names} ${d}`)
			.text(d => d);
	}

	drawColOptions(data, params, col, results_node, grid_node, yscale, xscale) {
		let plot = grid_node.select("svg");
		let param = Object.keys(params)[col];
		let options = Object.values(params);
		let col_idx = [0, ...options.map(d => d.length).map((sum => value => sum += value)(0))];
		let colWidth = options.map(d => d.length)[col] * (cell.width + cell.padding);
		let ypos;
		let m = this;

		if (state_value == 0) {
			ypos = 4 * cell.padding;
		} else {
			ypos = namingDim + 4 * cell.padding;
		}

		xscale.domain(d3.range(options.map(d => d.length)[col]))
			.range( [0, colWidth] );
			// .on("click", function(event, d) { handleSelection(event, d, this, param); });

		// let tempData = data.filter(d => (d['certainty'] == "cer_option1"))
		// 				.map(function(d) {
		// 					let temp = Object.assign({}, d)
		// 					temp["certainty"] = ["cer1", "cer2"];
		// 					return temp
		// 				});
		// console.log(tempData)

		let optionCell = plot.append("g")
			.attr("class", "option-value")
			.attr("transform",  `translate(
				${col == 0 ? groupPadding : groupPadding*(col+1) + col_idx[col]*(cell.width+cell.padding) - (col-1)*cell.padding}, 
				${ypos})`)
			.selectAll("g")
			.data(data)
			.join("g")
			.attr("transform", (d, i) => `translate(0, ${yscale(i)})`)
			// .attr("class", (d, i) => `${d[param]}`)
			.attr("class", function (d, i) {
				// console.log(d[param]);
				return d[param]
			})

		optionCell.selectAll("rect")
			.data(options[col])
			.join("rect")
			.attr("x", (d, i) => xscale(i) )
			.attr("width", cell.width)
			.attr("height", yscale.bandwidth())
			.attr("class", function(d, i) {
				let parent_class = d3.select(this.parentNode).attr("class").split(' ')[0];
				// console.log(parent_class);
				if (parent_class == d) {
					return `${options_container} ${selected_option} ${d}`
				}
				return `${options_container} ${d}`
			});
	}

	drawResults (data, results_node, grid_node, yscale) {
		let results_plot = results_node.select("svg")
		const height = this.size * (cell.height + cell.padding); // to fix as D3 calculates padding automatically
		const width = this.parameters().length * (cell.width + cell.padding); // to fix
		let ypos;

		d3.select("g.outcomePanel").remove();

		let xscale = d3.scaleLinear()
			.domain(d3.extent(data.map(d => d["conf.low"]).concat(data.map(d => d["conf.high"]), 0)))
			.range([margin.left, outVisWidth + margin.left]);

		if (state_value == 0) {
			ypos = 4 * cell.padding;
		} else {
			ypos = namingDim + 4 * cell.padding;
		}

		let outcomePlot = results_plot.append("g")
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


// Initialise UI items
// function handleSelection(event, d, node, parameter) {
// 	let xpos = +d3.select(node.parentNode).attr("x");
// 	let trans_xpos = d3.select(node.parentNode.parentNode)
// 						.attr("transform")
// 						.replace(/[a-z()\s]/g, '')
// 						.split(",")
// 						.map(x => +x);
// 	if (event.metaKey) {
// 		console.log(selected_options);
// 		if (!selected_options[parameter].includes(d)) { 
// 			selected_options[parameter].push(d)
// 			d3.select(node).attr("class", option_names + " " + selected_style);

// 			// update store
// 			selected.update(n => n + 1);

// 			// add the position of the node being selected
// 			option_xpos.push((xpos + trans_xpos[0]));
// 		} else {
// 			let index = selected_options[parameter].indexOf(d);
// 			if (index > -1) {
// 				selected_options[parameter].splice(index, 1);
// 			}
// 			d3.select(node).attr("class", option_names);
// 			selected.update(n => n - 1);

// 			// remove the position of the node being deselected
// 			option_xpos.splice(option_xpos.indexOf((xpos + trans_xpos[0])), 1);
// 		}
// 	}

// 	// update store if > 1;
// 	if (Object.entries(selected_options).map(i => i[1]).filter(i => i.length > 0).length == 1) {
// 		multi_param.set(1);
// 	} else {
// 		multi_param.set(0);
// 	}

// 	if (selected_value >= 1) {
// 		d3.select("#option-menu")
// 			.style("visibility", "visible")
// 			.style("left", `${Math.max(...option_xpos) + 2 * cell.width}px`)
// 			.style("top", "20px");
// 	} else {
// 		d3.select("#option-menu")
// 			.style("visibility", "hidden")
// 			.style("left", "0px")
// 			.style("top", "20px");
// 	}

// 	console.log(selected_value);
// 	console.log(selected_options);
// }


// export function drawOptionMenu(m, vis_node, grid_node, y, x) {
// 	const optionMenu = new OptionTooltip({ 
// 			target: grid_node.node()
// 	});

// 	optionMenu.$on("message", event => {	
// 		if (event.detail.action == "exclude") {
// 			let exclude = Object.entries(selected_options)
// 					.map( d => d[1].map( j => [d[0], j]) )
// 					.flat(1)
// 					.map( i => ({"parameter": i[0], "option": i[1]}) );

// 			m.draw(exclude, vis_node, grid_node, y, x);
// 		}

// 		// deselect everything and hide the menu;
// 		selected.set(0);
// 		selected_options = Object.keys(selected_options).reduce((acc, key) => {acc[key] = []; return acc; }, {});
// 		d3.select("#option-menu")
// 			.style("visibility", "hidden")
// 			.style("left", "0px")
// 			.style("top", "20px");
// 	})
// }