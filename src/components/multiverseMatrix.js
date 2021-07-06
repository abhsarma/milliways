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
	user-select: none;
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
let vis_type = CDF;

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

function any_common(arr) {
	let new_arr = arr.forEach((d, i) => {
		let new_arr = [...arr];
		let common = new_arr.splice(i, 1).map(x => d.map(item => x.includes(item))).reduce((a, b) => (a||b))
		console.log(common)
		return common
	})

	console.log(new_arr);
	return (new_arr);
}

console.log(any_common([[1, 2], [3, 4], [12, 0], [5, 72, 9, 15]]))


function recurseCombine(input) {
	let arr = JSON.parse(JSON.stringify(input));
	let n = arr.length;
	if ((n == 1)){ //} || no_common(arr)) {
		return arr
	} else {
		let contains = arr[0].map(d => arr[1].includes(d)).reduce((a,b) => (a||b)); // do the first two lists have any elements in common?
		if (contains) {
			// if they do, combine them
			let new_arr = [[...new Set(arr[0].concat(arr[1]))]].concat(arr.slice(2, (n + 1)));
			console.log(new_arr)
			return recurseCombine(new_arr);
		} else {
			return [arr[0]].concat(recurseCombine(arr.slice(1, (n+1))))
		}
	}
}

function combineJoinOptions(input_array) {
	let arr = JSON.parse(JSON.stringify(input_array));
	let params = arr.map(d => d['parameter']).filter((v, i, a) => a.indexOf(v) === i);
	let new_arr = {};

	for (let i in params) {
		let input = arr.filter(d => (d['parameter'] == params[i]))
						.map(d => d['options']);
		console.log(input);
		let output = recurseCombine(input);
		// console.log(output);
		new_arr[params[i]] = output
	}

	return Object.entries(new_arr);
}

// Initialise UI items
export function drawResultsMenu(m, vis_node, grid_node, vis_fun, y, x) {
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

		m.update(options_to_join, options_to_exclude, vis_node, grid_node, vis_fun, y, x);
	})
}

function which_idx(option_list, curr_options) {
	return option_list.map((d, i) => {
		if (curr_options.includes(d)) {
			return i;
		} else {
			return null;
		}
	}).filter(i => (i != null))
}

function sortByOutcome(gridData, outcomeData, ascending = false) {
	let o_data = d3.rollups(
			outcomeData.map((d, i) => ([i, d].flat())), 
			v => {
				v[0].shift()
				return d3.median(v[0], x => ((x[1] + x[2])/2))
			}, 
			d => d[0]);

	let order = o_data.map(d => d[1]);
	let g_data = gridData.map((d,i) => Object.assign({}, {orderBy: order[i], ...d}))

	if (ascending) {
		// we need to sort by descending here as values with higher mean estimate would have a lower 
		// cumulative probability density value at the median
		o_data.sort((a, b) => d3.descending(a[1], b[1]));
		g_data.sort((a, b) => d3.descending(a.orderBy, b.orderBy));
	} else {
		o_data.sort((a, b) => d3.ascending(a[1], b[1]));
		g_data.sort((a, b) => d3.ascending(a.orderBy, b.orderBy));
	}

	return [g_data, o_data];
}


function sortInGroups(gridData, outcomeData, ascending = false) {
	let group = new Array(outcomeData.length).fill(0, 0, 70).fill(1, 70, 140).fill(2, 140, 210)

	let o_data = d3.rollups(
			outcomeData.map((d, i) => ([i, d].flat())), 
			v => {
				v[0].shift()
				return d3.median(v[0], x => ((x[1] + x[2])/2))
			}, 
			d => d[0])
		.map((d, i) => d.concat(group[i]));

	let grouped_data = d3.groups(o_data, d => d[2])
		.map(d => d[1].sort((a, b) => d3.descending(a[1], b[1])))
		.flat(1);
}

function updateData(gridData, outcomeData, params, vis_fun, join_data = [], exclude_data = []) {
	// deep copy data structures
	let toJoin = JSON.parse(JSON.stringify(join_data));
	let toExclude = JSON.parse(JSON.stringify(exclude_data));
	let parameters = JSON.parse(JSON.stringify(params));

	// console.log(toJoin);
	let combine = combineJoinOptions(toJoin);

	let dat1 = updateGridData(gridData, parameters, combine, toJoin, toExclude)
	let dat2 = updateOutcomeData(gridData, outcomeData, parameters, vis_fun, combine, toJoin, toExclude);

	// sortByOutcome(dat1, dat2);
	// sortInGroups(dat1, dat2);

	return [dat1, dat2]
}

function updateGridData(gridData, parameters, combine, toJoin = [], toExclude = []) {
	// deep copy data structures
	let g_data = JSON.parse(JSON.stringify(gridData));

	let combined_options = combine
				.map( d => d[1].map( j => [d[0], j]) )
				.flat(1)
				.map( i => ({"parameter": i[0], "option": i[1], "replace": i[1][0]}) );

	let exclude = Object.entries(toExclude).filter(d => (d[1].length != 0))
				.map( d => d[1].map( j => [d[0], j]) )
				.flat(1)
				.map( i => ({"parameter": i[0], "option": i[1]}) );

	if (exclude.length > 0) {
		let toFilter = g_data.map(j => exclude.map(i => j[i['parameter']] != i['option']).reduce((a, b) => (a && b)));
		g_data = g_data.filter( (i, n) => toFilter[n] )
	}

	if (combine.length > 0) {
		let groups = combine.map(d => d[1].map(x => ([d[0], x])))
						.flat()
						.map((d, i) => (Object.assign({}, {id: i}, {parameter: d[0]}, {group: d[1].flat()})));

		let vec = g_data.map((d, i) => {
			let options = Object.values(d).flat();
			let g = groups.forEach(x => {
					let includes = options.map(d => x['group'].includes(d)).reduce((a, b) => (a || b));
					if (includes) {
						d[x['parameter']] = x['group']
					}
				})
			return d
		});

		let duplicates_data = vec.map(d => JSON.stringify(Object.values(d).flat()))

		let non_duplicates = duplicates_data.map((d, i) => {
			return duplicates_data.indexOf(d) == i;
		})

		g_data = vec.filter((d, i) => non_duplicates[i]);
	}

	return g_data;
}

function updateOutcomeData(gridData, outcomeData, parameters, vis_fun, combine, toJoin = [], toExclude = []) {
	// deep copy data structures
	let g_data = JSON.parse(JSON.stringify(gridData));
	let o_data = JSON.parse(JSON.stringify(outcomeData));
	let size = g_data.length;
	let option_list = Object.entries(parameters).map(d => d[1]);

	let exclude = Object.entries(toExclude).filter(d => (d[1].length != 0))
				.map( d => d[1].map( j => [d[0], j]) )
				.flat(1)
				.map( i => ({"parameter": i[0], "option": i[1]}) );

	if (exclude.length > 0) {
		let toFilter = g_data.map(j => exclude.map(i => j[i['parameter']] != i['option']).reduce((a, b) => (a && b)));

		g_data = g_data.filter( (i, n) => toFilter[n] );
		o_data = o_data.filter( (i, n) => toFilter[n] );
	}

	if (combine.length > 0) {
		let groups = combine.map(d => d[1].map(x => ([d[0], x])))
						.flat()
						.map((d, i) => (Object.assign({}, {id: i}, {parameter: d[0]}, {group: d[1].flat()})));

		let grouping_vector = g_data.map((d, i) => {
			let options = Object.values(d).flat();
			let idx = option_list.map(x => which_idx(x, options)).flat();
			let g = groups
				.map(x => {
					let includes = options.map(d => x['group'].includes(d)) // .reduce((a, b) => (a || b));
					return [includes.indexOf(true), x['id']];
				})

			g.forEach(x => {
				if (x[0] > -1) {
					idx[x[0]] = size + x[1]
				}
			})

			return JSON.stringify(idx);
		});

		// console.log(grouping_vector);

		o_data = d3.groups(
				o_data.map((d, i) => ({group: grouping_vector[i], data: d})),
				d => d.group
			).map(d => d[1].map(x => {
				delete x.group;
				return Object.values(x).flat();
			}))
			.map(x => {
				let mod = d3.rollups(x.flat(), v => {
					return [d3.min(v, d => d[1]), d3.max(v, d => d[1])]
				}, d => d[0]);
				return mod
			})
			.map(x => x.map(p => p.flat()))
	}

	return o_data
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

	changeOutcomeVar(term, toJoin, toExclude) {
		this.outcomeVar = term;
	}

	parameters() {
		// get the parameters from the first row as this is a rectangular dataset
		// is there a better way to do this?
		let param_names = Object.keys(this.data[0]['.parameter_assignment']);

		let dat = this.data.map(d => Object.assign( {}, ...param_names.map((i) => ({[i]: d[i]})) ));

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
	prepareData(vis = "CDF") {
		let parameters = [...Object.keys(this.parameters())];
		options_to_exclude = Object.assign({}, ...parameters.map((i) => ({[i]: []})));

		this.prepareGridData();
		this.prepareOutcomeData(vis = "CDF");
	}

	prepareGridData() {
		// creating a shallow copy which is fine for here
		let parameters = [...Object.keys(this.parameters())];
		this.gridData = this.data.map( d => Object.assign({}, ...parameters.map((i) => ({[i]: [d[i]]}))) );
	}

	prepareOutcomeData(graph = CDF) {
		// creating a shallow copy which is fine for here
		let term = this.outcomeVar;

		if (graph == CI) {
			this.outcomeData = this.data.map(function(d) { 
				return Object.assign({}, ...d["results"].filter(i => i.term == term).map(
					i => Object.assign({}, ...["estimate", "conf.low", "conf.high"].map((j) => ({[j]: i[j]})))
				))
			});
		} else {
			let temp = this.data.map(function(d) { 
				return Object.assign({}, ...d["results"].filter(i => i.term == term).map(
					i => Object.assign({}, ...["cdf.x", "cdf.y"].map((j) => ({[j]: i[j]})))
				))
			});

			let indices = temp[0]['cdf.x'].map((d, i) => i);

			this.outcomeData = temp.map((d, n) => d3.zip(d['cdf.x'], d['cdf.y'], d['cdf.y']))
		}
	}

	draw (selected_options = [], results_node, grid_node, vis_fun, y, x) {
		let [gridData, outcomeData] = updateData(this.gridData, this.outcomeData, this.parameters(), vis_fun, [], selected_options);

		// update grid
		drawGrid(gridData, this, results_node, grid_node, y, x);

		// update results
		// this.drawCI(outcomeData, results_node, grid_node, y);
		vis_fun(this.outcomeData, results_node, grid_node, this.size, this.parameters(), y);
	}

	update (toJoin = [], toExclude = [], results_node, grid_node, vis_fun, y, x) {
		let params = this.parameters();
		let [gridData, outcomeData] = updateData(this.gridData, this.outcomeData, this.parameters(), vis_fun, toJoin, toExclude);

		let options = Object.values(params);
		let colWidth = d3.max(options.map(d => d.length)) * (cell.width + cell.padding);
		let x2 = d3.scaleBand()
			.domain(d3.range(d3.max(options.map(d => d.length))))
			.range( [0, colWidth] )

		// update grid
		d3.selectAll("g.option-value").remove();		
		Object.keys(params).forEach( 
			(d, i) => drawColOptions(gridData, this, d, results_node, grid_node, y, x, x2)
		);

		// update results
		vis_fun(outcomeData, results_node, grid_node, this.size, this.parameters(), y);

		Object.values(options_to_exclude)
			.flat()
			.forEach(d => {
				d3.selectAll(`rect.${d}`).style("opacity", 0.2)
			})
	}
}

export default multiverseMatrix

// function from drawing the decision grid
function drawGrid (data, m_obj, results_node, grid_node, yscale, x) {
	let params = m_obj.parameters();

	d3.selectAll("g.option-value").remove();
	d3.selectAll("g.option-name").remove();

	drawHeaders(params, results_node, grid_node, margin, x);
	drawCols(data, m_obj, results_node, grid_node, yscale, x);
}

function drawHeaders(params, results_node, grid_node, margin, xscale) {
	let plot = grid_node.select("svg");

	let options = Object.values(params);
	let col_idx = [0, ...options.map(d => d.length).map((sum => value => sum += value)(0))];

	let param_names = plot.append("g")
		.selectAll("text")
		.data(Object.keys(params))
		.join("g")
		.attr("class", d => `parameter ${d}`)
		.append("foreignObject")
		.attr("x", d => xscale(d))
		.attr("y", 4)
		.attr("width", (d, i) => (cell.width + cell.padding/2) * options.map(d => d.length)[i] )
		.attr("height", cell.height + "px")
		.append("xhtml:div")
		.attr("class", d => parameters + " parameter-name " + d.replace(/ /g, "_") )
		.text(d => d)
		.style('cursor', 'move')

	param_names.each(function(d, i) {
		let node = d3.select("div.grid").node();
		let xpos = (i == 0) ? 0 : groupPadding*i + col_idx[i]*(cell.width+cell.padding) - (i-1)*cell.padding;
		let w = (cell.width + cell.padding/2) * options.map(d => d.length)[i]
	})
}

function drawCols(data, m_obj, results_node, grid_node, yscale, x1) {
	let plot = grid_node.select("svg");
	let params = m_obj.parameters();
	let parameter_list = Object.entries(params)
		.map(d => Object.assign({}, {parameter: d[0], options: d[1]}))

	let optionContainer = plot.append("g")
		.attr("class", "parameter-options")
		.selectAll("g")
		.data(parameter_list)
		.join("g")
		.attr("class", d => `option-name ${d.parameter}`)
		.attr( "transform", d => `translate(${x1(d.parameter)}, ${yscale(0)})`)
		.attr("text-anchor", "end")

	// let parameter_name = Object.keys(params)[col];
	let options = parameter_list.map(d => d.options);
	let col_idx = [0, ...options.map(d => d.length).map((sum => value => sum += value)(0))];
	let colWidth = d3.max(options.map(d => d.length)) * (cell.width + cell.padding);
	let ypos;

	if (state_value == 0) {
		ypos = 4 * cell.padding;
	} else {
		ypos = namingDim + 4 * cell.padding;
	}

	let x2 = d3.scaleBand()
		.domain(d3.range(d3.max(options.map(d => d.length))))
		.range( [0, colWidth] );

	Object.keys(params).forEach( 
		(d, i) => {
			// drawCols(data, m_obj, i, results_node, grid_node, yscale, x);
			drawColNames(m_obj, d, results_node, grid_node, optionContainer, yscale, x1, x2);
			drawColOptions(data, m_obj, d, results_node, grid_node, yscale, x1, x2);
	});

	let drag = d3.drag();
	let dragging = {};

	// let params = Object.keys(m_obj.parameters());

	// d3.selectAll("g.parameter").call(
	// 	d3.drag()
	// 		.subject(function(event, d) { 
	// 			return {y: xscale(d)}; 
	// 		})
	// 		.on("start", function(event, d) {
	// 			dragging[d] = xscale(d);
	// 			console.log(dragging);

	// 			// Move the row that is moving on the front
	// 			let sel = d3.select(this);
	// 			sel.moveToFront();
	// 		})
	// 		.on("drag", function(event, d) {
	// 			// Hide what is in the back
	// 		  	dragging[d] = Math.min(xscale.range()[xscale.range().length - 1], Math.max(0, event.x));
	// 		  	params.sort(function(a, b) { return position(a) - position(b); });
	// 		  	xscale.domain(params);

	// 		  	d3.selectAll(".row").attr("transform", function(d, i) { 
	// 				return "translate(0," + position(d, dragging, xscale) + ")"; 
	// 			});
	// 		})
	// 		.on("end", function(event, d) {
	// 		  	delete dragging[d];
	// 		  	console.log(dragging, xscale.domain());
	// 		  	// dragTransition(d3.select(this)).attr("transform", `translate(${xscale(d)}, 0)`);

	// 		  	// d3.selectAll(".column").each(function(d) {
	// 		   //  	d3.select(this).selectAll(".cellcolumn").attr("x", function(d) { 
	// 					// return -xscale(d)-90; });
	// 		  	// });
	// 		})
	// );
}


d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
}

function position(d, dragging, xscale) {
	var v = dragging[d];
	return v == null ? xscale(d) : v;
}

function dragTransition(g) {
  	return g.transition().duration(500);
}

function drawColNames(m_obj, parameter, results_node, grid_node, container, yscale, x1, x2) {
	let options = m_obj.parameters()[parameter]

	d3.select(`g.option-name.${parameter}`)
		.selectAll("text")
		.data(d => options.slice(0, -1))
		.join("foreignObject")
		.attr("class", (d, i) => `option-join ${d}`)
		.attr("width", 2*iconSize + "px" )
		.attr("height", 2*iconSize + "px")
		.attr("x", (d, i) => (x2(i) + x2(i+1))/2)
		.each(function(d, i) {
			let node = d3.select(this).node()

			const optionJoin = new OptionJoin({ 
				target: node,
				props: {
					option1: options[i],
					option2: options[i+1]
				}
			})

			optionJoin.$on('message', event => {
				let option_pair = [options[i], options[i+1]];
				if (event.detail.text) {
					options_to_join.push({'parameter': parameter, 'options': option_pair});
				} else {
					options_to_join = options_to_join.filter(i => (JSON.stringify(i['options']) !== JSON.stringify(option_pair)));
				}
				m_obj.update(options_to_join, options_to_exclude, results_node, grid_node, vis_type, yscale, x1);
			})
		});

	let optionNames = d3.select(`g.option-name.${parameter}`)
		.selectAll("text")
		.data(options)
		.join("foreignObject")
		.attr("width", cell.width + cell.padding + "px" )
		.attr("height", namingDim + "px")
		.attr("x", (d, i) => x2(i) )
		.attr("y", iconSize + cell.padding + "px")
		.attr("class", (d, i) => `option-name ${d}`)

	optionNames.each(function(d, i) {
		let node = d3.select(`foreignObject.option-name.${d}`).node();

		const optionSwitch = new OptionToggle({ 
			target: node,
			props: {
				option: d
			}
		});

		optionSwitch.$on('message', event => {
			if (!event.detail.text) {
				options_to_exclude[parameter].push(d);
				d3.selectAll(`button.join.${d}`).property("disabled", true)
			} else {
				let index = options_to_exclude[parameter].indexOf(d);
				d3.selectAll(`button.join.${d}`).property("disabled", false)
				if (index > -1) {
					options_to_exclude[parameter].splice(index, 1);
				} else {
					console.log("error option index not found");
				}
			}

			m_obj.update(options_to_join, options_to_exclude, results_node, grid_node, vis_type, yscale, x1);
		})
	})

	optionNames.append("xhtml:div")
		.attr("class", (d, i) => `option-label ${option_names} ${d}`)
		.text(d => d);
}

function drawColOptions(data, m_obj, parameter, results_node, grid_node, yscale, x1, x2) {
	let plot = grid_node.select("svg");
	let options = m_obj.parameters()[parameter];
	let ypos;

	if (state_value == 0) {
		ypos = 4 * cell.padding;
	} else {
		ypos = namingDim + 4 * cell.padding;
	}

	let optionCell = plot.append("g")
		.attr("class", "option-value")
		.attr("transform",  `translate(${x1(parameter)}, ${ypos})`)
		.selectAll("g")
		.data(data)
		.join("g")
		.attr("transform", (d, i) => {
			let whitespace = 0;
			// if (parameter != Object.keys(data[0])[0] && i > 0) {
			// 	whitespace = (i % options.length) == 0 ? 10 : 0 
			// }
			return `translate(0, ${yscale(i) + whitespace})`
		})
		.attr("class", function (d, i) {
			return d[parameter].join(" ")
		})

	optionCell.selectAll("rect")
		.data(options)
		.join("rect")
		.attr("x", (d, i) => x2(i) )
		.attr("width", cell.width)
		.attr("height", yscale.bandwidth())
		.attr("class", function(d, i) {
			let parent_class = d3.select(this.parentNode).attr("class").split(' ');
			if (parent_class.includes(d)) {
				return `${options_container} ${selected_option} ${d}`
			}
			return `${options_container} ${d}`
		});
}


export function CI (data, results_node, grid_node, size, parameters, yscale) {
	let results_plot = results_node.select("svg")
	const height = size * (cell.height + cell.padding); // to fix as D3 calculates padding automatically
	const width = parameters.length * (cell.width + cell.padding); // to fix
	let ypos;

	d3.select("g.outcomePanel").remove();

	let xscale = d3.scaleLinear()
		.domain(d3.extent(data.map(d => d["conf.low"]).concat(data.map(d => d["conf.high"]), 0)))
		.range([margin.left, outVisWidth + margin.left]);

	console.log(data);

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

	let xAxis = d3.axisTop(xscale)
		.ticks(5);

	outcomePlot.append("g")
		.attr("transform", `translate(0, ${yscale(0) - cell.padding})`)
		.call(xAxis)
		.style("font-size", "12px");

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

export function CDF (data, results_node, grid_node, size, parameters, yscale) {
	let results_plot = results_node.select("svg")
	const height = size * (cell.height + cell.padding); // to fix as D3 calculates padding automatically
	const width = parameters.length * (cell.width + cell.padding); // to fix
	let ypos;

	d3.select("g.outcomePanel").remove();

	let xscale = d3.scaleLinear()
		.domain(d3.extent(data.map(d => d.map(x => x[0])).flat()))
		.range([margin.left, outVisWidth]);

	let y = d3.scaleLinear()
		.domain(d3.extent( data.map(d => d.map(x => x[1])).flat() ))
		.range([(yscale.step() - cell.padding), 0]);

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

	// outcomePlot.append("line")
	// 	.attr("class", "x-axis-line")
	// 	.attr("x1", xscale.range()[0] )
	// 	.attr("y1", yscale(0) - cell.padding)
	// 	.attr("x2", xscale.range()[1] )
	// 	.attr("y2", yscale(0) - cell.padding)
	// 	.attr("stroke", "#666666")
	// 	.attr("stroke-width", 2);

	let xAxis = d3.axisTop(xscale)
		.ticks(5);

	outcomePlot.append("g")
		.attr("transform", `translate(0, ${yscale(0) - cell.padding})`)
		.call(xAxis)
		.style("font-size", "12px");

	// add a group for each universe
	let panelPlot = outcomePlot.selectAll(".universe")
		.data(data)
		.enter()
		.append("g")
		.attr("class", (d, i) => `universe universe-${i}`)
		.attr("transform", (d, i) => `translate(0, ${yscale(i)})`);

	// Add reference line
	panelPlot.append("line")
		.attr("class", "x-axis")
		.attr("x1", xscale.range()[0] )
		.attr("y1", y(0))
		.attr("x2", xscale.range()[1] )
		.attr("y2", y(0))
		.attr("stroke", "#e0e0e0")
		.attr("stroke-width", 1);

	let area = d3.area()
		.curve(d3.curveLinear)
		.x(d => xscale(d[0]))
		.y0(d => y(d[1]))
		.y1(d => y(d[2]))

	panelPlot.append("path")
      .datum(d => d)
      .attr("fill", "steelblue")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", area);
}


// function dragOptions() {
// 	let drag = d3.drag();
// }



