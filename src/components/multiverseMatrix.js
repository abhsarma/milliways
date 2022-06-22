import { css, cx } from '@emotion/css'
import * as d3 from 'd3';
import { cell, nameContainer, iconSize, groupPadding, margin, outVisWidth, header1, namingDim } from './dimensions.js'
import OptionToggle from './toggle-hide-option.svelte'
import OptionJoin from './toggle-join-option.svelte'
import { state, exclude_options, join_options, groupParams, option_order_scale } from './stores.js';
import { arrayEqual, mean } from './helpers/arrayMethods.js'
import { colors } from './colorPallete.js';

//helpers
import combineJoinOptions from './helpers/combineJoinOptions'
import sortByOutcome from './helpers/sortByOutcome.js';
import sortByGroup from './helpers/sortByGroups.js';
import excludeAndCombineOutcomes from './helpers/excludeAndCombineOutcomes.js';

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
	fill: ${colors.inactive};
`;

export const selected_option = css`
	fill: ${colors.active};
`;

// Stores
let state_value;
let options_to_exclude;
let options_to_join;
let sortByGroupParams;
let vis_type = CDF;

state.subscribe(value => state_value = value);
groupParams.subscribe(value => sortByGroupParams = value)
exclude_options.subscribe(value => options_to_exclude = value);
join_options.subscribe(value => options_to_join = value);

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
		return common
	})

	// console.log(new_arr);
	return (new_arr);
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

class multiverseMatrix {
	constructor (dat) {		
		// data for the plot constructor
		this.data = dat;

		// meta data for the multiverse object
		this.universes = [...new Set(dat.map(d => d['.universe']))];
		this.size = this.universes.length;
		this.allOutcomeVars = dat[0]["results"].map(i => i["term"]);
		this.outcomes = []; //[this.allOutcomeVars[0]];
		this.gridData = null;
		this.gridDataAll = null;

		// sorting index, initialized to -1 to indicate no default sort
		this.sortIndex = -1;
		this.sortAscending = true; 
	}

	parameters = () => {

		// get the parameters from the first row as this is a rectangular dataset
		// is there a better way to do this?
		let param_names = Object.keys(this.data[0]['.parameter_assignment']);


		let dat = this.data.map(d => Object.assign( {}, ...param_names.map((i) => ({[i]: d[i]})) ));

		return Object.assign( {}, ...param_names.map( (x) => ({[x]: d3.groups(dat, d => d[x]).map( i => i[0] )}) ) );
	}

	// creates the data structure for the grid matrix
	// we will draw this plot as a bar chart
	// input: JSON multiverse object (this.data), parameters (this.parameters)
	// output: rectangular data structure with columns corresponding to each parameter, 
	// 		   estimate, conf.low (if applicable), conf.high (if applicable)
	initializeData = (vis = "CDF") => {
		let parameters = [...Object.keys(this.parameters())];
		options_to_exclude = Object.assign({}, ...parameters.map((i) => ({[i]: []})));
		exclude_options.update(arr => arr=options_to_exclude);

		this.initializeGridData();
		this.initializeOutcomeData();
	}

	initializeGridData = () => {
		// creating a shallow copy which is fine for here
		let parameters = [...Object.keys(this.parameters())];
		let g_data = this.data.map( d => Object.assign({}, ...parameters.map((i) => ({[i]: [d[i]]}))) );
		this.gridData = g_data;
		this.gridDataAll = g_data;
	}

	initializeOutcomeData = (join_data = [], exclude_data = [], graph = CDF) => { // change i here
		let i = this.outcomes.length;
		let term = this.allOutcomeVars[0];
		let toJoin = JSON.parse(JSON.stringify(join_data));
		let toExclude = JSON.parse(JSON.stringify(exclude_data));
		let combine = combineJoinOptions(toJoin);
		let e_data, o_data
		
		// gets list of paramters and the options to exclude
		let exclude = Object.entries(toExclude).filter(d => (d[1].length != 0))
					.map( d => d[1].map( j => [d[0], j]) )
					.flat(1)
					.map( i => ({"parameter": i[0], "option": i[1]}) );

		let option_list = Object.entries(this.parameters()).map(d => d[1]);

		this.outcomes.push({
			var: term,
			data: null,
			id: this.outcomes.length === 0 ? 0 : this.outcomes[this.outcomes.length-1].id + 1
		});

		let formattedCDFOutcomeData = formatCDFOutcomeData(this.data, term)
		o_data = formattedCDFOutcomeData.map((d, n) => d3.zip(d['cdf.x'], d['cdf.y'], d['cdf.y']))
		e_data = formattedCDFOutcomeData.map((d,n)=>d['estimate'])
		// We only support mirrored CDFs at this point, but in the future we may consider supporting other chart types
		// if (graph == CI) {
		// 	this.outcomes[i].data = this.data.map(function(d) { 
		// 		return Object.assign({}, ...d["results"].filter(i => i.term == term).map(
		// 			i => Object.assign({}, ...["estimate", "conf.low", "conf.high"].map((j) => ({[j]: i[j]})))
		// 		))
		// 	});
		// } else {
		// 	let formattedCDFOutcomeData = formatCDFOutcomeData(this.data, term)
		// 	o_data = formattedCDFOutcomeData.map((d, n) => d3.zip(d['cdf.x'], d['cdf.y'], d['cdf.y']))
		// 	e_data = formattedCDFOutcomeData.map((d,n)=>d['estimate'])
		// }

		const {e_data_processed, o_data_processed} = excludeAndCombineOutcomes(
			this.gridData, 
			o_data, 
			option_list, 
			exclude,
			combine,
			e_data
		)

		this.outcomes[i].data = o_data_processed;
		this.outcomes[i].estimate = e_data_processed;
		// this.estimateData = e_data_processed;
	}
	
	updateGridData = (join_data = [], exclude_data = []) => {
		let toJoin = JSON.parse(JSON.stringify(join_data));
		let toExclude = JSON.parse(JSON.stringify(exclude_data));
		let combine = combineJoinOptions(toJoin);

		// deep copy data structures
		let g_data = JSON.parse(JSON.stringify(this.gridDataAll));
	
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

		this.gridData = g_data
	}
	
	updateOutcomeData = (index, term, join_data = [], exclude_data = [], graph = CDF) => {
		// gets a re-intitialzied version of gridData
		let parameters = [...Object.keys(this.parameters())];
		let gridData = this.data.map( d => Object.assign({}, ...parameters.map((i) => ({[i]: [d[i]]}))) );

		let g_data = JSON.parse(JSON.stringify(gridData));
		let o_data = JSON.parse(JSON.stringify(this.outcomes[index].data));
		let e_data
		let toJoin = JSON.parse(JSON.stringify(join_data));
		let toExclude = JSON.parse(JSON.stringify(exclude_data));

		let exclude = Object.entries(toExclude).filter(d => (d[1].length != 0))
					.map( d => d[1].map( j => [d[0], j]) )
					.flat(1)
					.map( i => ({"parameter": i[0], "option": i[1]}) );
		let combine = combineJoinOptions(toJoin);


		let size = g_data.length;

		let formattedCDFOutcomeData  = formatCDFOutcomeData(this.data, term);
		o_data = formattedCDFOutcomeData.map((d, n) => d3.zip(d['cdf.x'], d['cdf.y'], d['cdf.y']));
		e_data = formattedCDFOutcomeData.map((d,n)=>d['estimate']);

		// we need to update the term and the associated data for creating CDFs
		// if (graph == CI) {
		// 	o_data = this.data.map(function(d) { 
		// 		return Object.assign({}, ...d["results"].filter(i => i.term == term).map(
		// 			i => Object.assign({}, ...["estimate", "conf.low", "conf.high"].map((j) => ({[j]: i[j]})))
		// 		))
		// 	});
		// } else {
		// 	let formattedCDFOutcomeData  = formatCDFOutcomeData(this.data, term);
		// 	o_data = formattedCDFOutcomeData.map((d, n) => d3.zip(d['cdf.x'], d['cdf.y'], d['cdf.y']));
		// 	e_data = formattedCDFOutcomeData.map((d,n)=>d['estimate']);
		// }

		let option_list = Object.entries(this.parameters()).map(d => d[1]);

		const {o_data_processed, e_data_processed} = excludeAndCombineOutcomes(g_data, o_data, option_list, exclude, combine, e_data);
		this.outcomes[index].data = o_data_processed;
		this.outcomes[index].estimate = e_data_processed;
		// this.estimateData = e_data_processed;
	}

	updateHandler(join, exclude) {
		// call update grid data
		this.updateGridData(join, exclude);
	
		// call update otucomes
		for (let i in this.outcomes) {
			this.updateOutcomeData(i, this.outcomes[i].var, join, exclude);
		}

		let outcomeData = this.outcomes.map(d => d.data);
		let estimateData;

		if (this.sortIndex != -1) {
			estimateData = this.outcomes.map(d => d.estimate)
			// estimateData = this.outcomes[this.sortIndex].estimate;

			console.log("Calling sort by groups with:", sortByGroupParams)
			const {g_data, o_data, e_data} = sortByGroup(sortByGroupParams, this.gridData, outcomeData, estimateData, this.sortAscending,this.sortIndex);

			// const {g_data, o_data, e_data} = sortByGroup(['certainty'], this.gridData, outcomeData, estimateData, this.sortAscending, 0);
			this.gridData = g_data;

			// if we want estimates for only the vector which is being sorted by: e_data[this.sortIndex]
			let temp = this.outcomes.map((d, i) => {
				d.data = o_data[i];
				d.estimate = e_data[i];
				return d;
			});
			this.outcomes = temp;
		}
	}
}

export default multiverseMatrix


/**
 * function for processing array containing CDF information 
 * 
 * @param {object} data Multiverse data containing information about each universe and CDF for each term
 * @param {string} term Coefficient name
 * 
 * @return {array} array of objects in the following format
 * [
 *     {cdf.x: [...], cdf.y: [...], estimate: ...}, // corresponds to each universe (or group of universes when joined)
 *     ...
 * ]
 **/
function formatCDFOutcomeData(data, term){
	let temp = data.map(function(d) { 
		return Object.assign({}, ...d["results"].filter(i => i.term == term).map(
			i => Object.assign({}, ...["cdf.x", "cdf.y", "estimate"].map((j) => ({[j]: i[j]})))
		))
	});
	return temp
}


/**
 * wrapper function for drawing the:
 * (1) parameter names of the decision grid
 * (2) column names of the decision grid
 * 
 * @param {object} gridData Multiverse grid data
 * @param {object of arrays} params Multiverse parameters and corresponding options
 * @param {function} yscale A D3 scale definition for y position of each universe
 * @param {function} x A D3 scale definition for x position of each parameter
 **/
export function drawGridNames (gridData, params, yscale, x) {
	drawParameterNames(params, x);
	// drawOptionNames(params, yscale, x);
	drawColNames(params, yscale, x);
}

/**
 * function for drawing the parameter names of the decision grid
 * 
 * @param {object} gridData Multiverse grid data
 * @param {object of arrays} params Multiverse parameters and corresponding options
 * @param {function} yscale A D3 scale definition for y position of each universe
 * @param {function} x A D3 scale definition for x position of each parameter
 **/
function drawParameterNames(params, xscale) {
	let plot = d3.select(".grid").select("svg");

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

/**
 * function for drawing the Option names of the decision grid
 * 
 * @param {object of arrays} params Multiverse parameters and corresponding options
 * @param {string} param A D3 scale definition for y position of each universe
 * @param {x2} x A D3 scale definition for x position of each option
 **/
function drawColNames(params, y, x1) {
	let plot = d3.select('.grid').select('svg');
	let param_names = Object.keys(params) //[ Object.keys(params)[0] ]
	let ypos = 4 * cell.padding;
	let parameter_list = Object.entries(params)
		.map(d => Object.assign({}, {parameter: d[0], options: d[1]}))

	let options = parameter_list.map(d => d.options);
	let colWidth = d3.max(options.map(d => d.length)) * (cell.width + cell.padding);

	let x2 = d3.scaleBand()
		.domain(d3.range(d3.max(options.map(d => d.length))))
		.range( [0, colWidth] );

	let parameterCols = plot.selectAll("g.parameter-col")
		.data(param_names)
		.join("g")
		.attr("transform",  (d, i) => `translate(${x1(d)}, ${y(0)})`)
		.attr("class", (d, i) => `parameter-col ${d}`)

	parameterCols.selectAll("foreignObject")
		.data((d, i) => options[i].slice(0, -1))
		.join("foreignObject")
		.attr("class", (d, i) => `option-join ${d}`)
		.attr("width", 2*iconSize + "px" )
		.attr("height", 2*iconSize + "px")
		.attr("x", (d, i) => (x2(i) + x2(i+1))/2)
		.each(function(d, i) {
			let node = d3.select(this).node();
			let parent_class = d3.select(this.parentNode).attr('class').split(' ');
			let parameter = parent_class[1];

			const optionJoin = new OptionJoin({ 
				target: node,
				props: {
					parameter: parameter,
					index: i,
					option_set: params[parameter]
				}
			})

			optionJoin.$on('message', event => {
				let option_pair = [options[i], options[i+1]];
				if (event.detail.text) {
					options_to_join.push({'parameter': parameter, 'options': option_pair});
				} else {
					options_to_join = options_to_join.filter(i => (JSON.stringify(i['options']) !== JSON.stringify(option_pair)));
				}
				join_options.update(arr => arr = options_to_join);
			})
		});

	let optionCols = parameterCols.selectAll('g')
		.data( (d, i) => (params[d].map((j, k) => [{parameter: d, option: j, index: k}])) )
		.join('g')
		.attr("class", function (d, i) {
			return `option-value ${d[0].parameter} ${d[0].option}`
		})
		.attr("transform",  (d, i) => `translate(${x2(i)}, 0)`)

	let optionNames = optionCols
		.append("foreignObject")
		.attr("width", cell.width + cell.padding + "px" )
		.attr("height", namingDim + "px")
		.attr("x", (d, i) => 0 )
		.attr("y", iconSize + cell.padding + "px")
		.attr("class", (d, i) => `option-name ${d[0].option}`)

	optionNames.each(function(d, i) {
		let node = d3.select(`foreignObject.option-name.${d[0].option}`).node();
		let parameter = d[0].parameter;
		let option = d[0].option;

		const optionSwitch = new OptionToggle({ 
			target: node,
			props: {
				option: option
			}
		});

		optionSwitch.$on('message', event => {
			if (!event.detail.text) {
				options_to_exclude[parameter].push(option);
				d3.selectAll(`button.join.${option}`).property("disabled", true)
			} else {
				let index = options_to_exclude[parameter].indexOf(option);
				d3.selectAll(`button.join.${option}`).property("disabled", false)

				if (index > -1) {
					options_to_exclude[parameter].splice(index, 1);
				} else {
					console.log("error option index not found");
				}
			}
			exclude_options.update(arr => arr = options_to_exclude);
		})
	})

	optionNames.append("xhtml:div")
		.attr("class", (d, i) => `option-label ${option_names} ${d[0].option}`)
		.text(d => d[0].option);
}

/**
 * function for drawing the decision grid (indicating the configuration for each universe in the multiverse)
 * 
 * @param {object} gridData Multiverse grid data
 * @param {object of arrays} params Multiverse parameters and corresponding options
 * @param {function} yscale A D3 scale definition for y position of each universe
 * @param {function} x1 A D3 scale definition for x position of each parameter
 * @param {function} x2 A D3 scale definition for x position of each option within each parameter
 **/
export function drawMatrixGrid(data, params, yscale, x1, x2) {
	let plot = d3.select('.grid').select('svg');
	let param_names = Object.keys(params) //[ Object.keys(params)[0] ]

	let optionCols = d3.selectAll(`g.parameter-col`).selectAll(`g.option-value`)

	optionCols.each((d, i) => {
		let parameter = d[0].parameter;
		let option = d[0].option;

		let optionNodes = d3.select(`g.${option}`)
			.selectAll(`rect.${option}`)
			.data(data)
			.join(
				enter => enter.append("rect").style('opacity', 1),
				update => update,
				exit => exit.remove()
			)
			.attr("x", 0)
			.attr("y", (d, i) => yscale(i) + namingDim - (iconSize + cell.padding))
			.attr("width", cell.width)
			.attr("height", yscale.bandwidth())
			.attr("class", function(d, i) {
				if (d[parameter].includes(option)) {
					return `${options_container} ${selected_option} ${option}`
				}
				return `${options_container} ${option}`
			});
	})
}

/**
 * wrapper function for drawing the outcome CDF for (one or more) coefficient(s) per universe
 * 
 * @param {array of object} outcomes updateHandlerEach object contains: (1) a field for CDFs, and (2) estimate for each universe
 * @param {integer} size # of universes in the multiverse
 * @param {function} yscale A D3 scale definition for y position of each universe
 **/
export function drawOutcomes (outcomes, size, yscale) {
	for (let i in outcomes) {
		let data = outcomes[i].data;
		let term = outcomes[i].var;
		let estimate = outcomes[i].estimate;
		CDF(data, estimate, i, size, yscale, term);
	}
}

/**
 * function for drawing the outcome CDF for (one or more) coefficient(s) per universe
 * 
 * @param {array of arrays} data Contains x, y_lower and y_upper values to draw p-boxes for a coefficient for each universe
 * @param {integer} i index corresponding to the outcome plot being drawn
 * @param {integer} size # of universes in the multiverse
 * @param {function} yscale A D3 scale definition for y position of each universe
 * @param {string} term Coefficient name
 **/
export function CDF (data, estimate, i, size, yscale, term) {
	let results_plot = d3.select('svg#vis-' + i);
	const height = size * (cell.height + cell.padding); // to fix as D3 calculates padding automatically
	let ypos;

	let domain = d3.extent(data.map(d => d.map(x => x[0])).flat())

	let xscale = d3.scaleLinear()
		.domain(d3.extent(data.map(d => d.map(x => x[0])).flat()))
		.range([margin.left, outVisWidth]);
	
	let y = d3.scaleLinear()
		.domain([0, 0.5])
		.range([(yscale.step() - cell.padding), 0]);

	if (state_value == 0) {
		ypos = 4 * cell.padding;
	} else {
		ypos = namingDim + 4 * cell.padding;
	}

	let outcomePlot = results_plot.append("g")
		.attr("class", `outcomePanel plot-${i}`)
		.attr( "transform", `translate(0,  ${ypos})`)

	let intercept = d3
		.select(`g.outcomePanel.plot-${i}`)
		.selectAll('.zero-line')
		.data([data])
		.join(
			enter => enter.append("line")
					.attr('class', 'zero-line')
					.attr("x1", xscale(0))
					.attr("x2", xscale(0)),
			update => update
					.attr("x1", xscale(0))
					.attr("x2", xscale(0)),
			exit => exit.remove()
		)
		.attr("y1", margin.top)
		.attr("y2", height - margin.bottom)
		.attr("stroke", `${colors.gray}`)
		.attr("stroke-width", 2);

	let xAxis = d3.select(`g.outcomePanel.plot-${i}`);

	if (xAxis.select('.x-axis').node()) {
		xAxis.select(".x-axis")
			.call(d3.axisTop(xscale).ticks(5))
			.call(g => g.selectAll(".tick line") //.clone()
				.attr("y2", height - margin.bottom)
				.attr("stroke-opacity", 0.1)
			)
			.style("font-size", "12px");
	} else {
		xAxis.append('g')
			.attr("class", "x-axis")
			.attr("transform", `translate(0, ${yscale(0) - cell.padding})`)
			.call(d3.axisTop(xscale).ticks(5))
			.call(g => g.selectAll(".tick line").clone()
				.attr("y2", height - margin.bottom)
				.attr("stroke-opacity", 0.1)
			)
			.style("font-size", "12px");
	}

	let area = d3.area()
		.curve(d3.curveLinear)
		.x(d => xscale(d[0]))
		.y0(d => y(d[1]))
		.y1(d => y(d[2]))

	let line = d3.line()
		.x(d => xscale(d[0]))
		.y(d => y(d[1]));

	// add a group for each universe
	let panelPlot = d3
		.select(`g.outcomePanel.plot-${i}`)
		.selectAll(".universe")
		.data(data)
		.join(
			enter => enterCDF(enter, estimate, term, area, line, xscale, yscale, y),
			update => updateCDF(update, estimate, area, line, xscale, y),
			exit => exitCDF(exit)
		)
}

// helper function called by CDF
function enterCDF(enter, estimate, term, area, line, xscale, yscale, y) {
	enter.append('g')
		.attr("class", (d, i) => `universe universe-${i} ${term}`)
		.attr("transform", (d, i) => `translate(0, ${yscale(i)})`)
		.call( g => {
				g.append("path")
					.attr("class", "cdf")
					.datum((d, i) => d)
					.attr("fill", `${colors.secondary}`)
					.attr("stroke", `${colors.secondary}`)
					.attr("stroke-width", 1.5)
					.attr("d", area)

				g.append("path")
					.attr("class", "median")
					.datum((d, i) => {
						if (estimate[i].length === undefined) return [[Math.min(estimate[i]), 0.5], [Math.max(estimate[i]), 0.5]]
							else return [[Math.min(...estimate[i]), 0.5], [Math.max(...estimate[i]), 0.5]]
					})
					.attr("fill", `${colors.primary}`)
					.attr("stroke", `${colors.primary}`)
					.attr("stroke-width", 2)
					.attr("d", line)

				g.append("circle")
					.datum((d, i) => {
						if (estimate[i].length === undefined) return estimate[i]
							else return mean(...estimate[i])
					})
					.attr("fill", `${colors.primary}`)
					.attr("stroke", `${colors.primary}`)
					.attr("cx", d => xscale(d))
					.attr("cy", y(0.5))
					.attr("r", 0.5)
			}
		)
}

// helper function called by CDF
function updateCDF(update, estimate, area, line, xscale, y) {
	update
		.call(g => {
			g.select('path.cdf')
				.datum((d, i) => d)
				.attr("d", area)

			g.select("path.median")
				.datum((d, i) => {
					if (estimate[i].length === undefined) return [[Math.min(estimate[i]), 0.5], [Math.max(estimate[i]), 0.5]] 
						else return [[Math.min(...estimate[i]), 0.5], [Math.max(...estimate[i]), 0.5]]
				})
				.attr("d", line)

			g.select('circle')
				.datum((d, i) => {
					if (estimate[i].length === undefined) return estimate[i]
						else return mean(...estimate[i])
				})
				.attr("cx", d => xscale(d))
				.attr("cy", y(0.5))
		})
}

// helper function called by CDF
function exitCDF(exit) {
	exit.call(g => g.remove())
}

export function drawSortByGroupsDivider(params, xscale, h) {
	let dividerWidth = 6;
	let boundaries = xscale.range().map( d => (d - (groupPadding/2)) );
	
	let groupedSortDivider = d3.select(".grid")
		.select("svg")
		.append('line')
		.attr("class", `groupedSortDivider ${boundaries.length - 1}`)
		.attr("x1", boundaries[boundaries.length - 1])
		.attr("y1", 0)
		.attr("x2", boundaries[boundaries.length - 1]) 
		.attr("y2", h)
		.style("stroke", "black")
		.style("stroke-width", dividerWidth)
		.style("cursor", "pointer")
}


// export function CI (data, results_node, size, yscale) {
// 	let results_plot = results_node.select("svg")
// 	const height = size * (cell.height + cell.padding); // to fix as D3 calculates padding automatically
// 	const width = parameters.length * (cell.width + cell.padding); // to fix
// 	let ypos;

// 	// d3.select("g.outcomePanel").remove();

// 	let xscale = d3.scaleLinear()
// 		.domain(d3.extent(data.map(d => d["conf.low"]).concat(data.map(d => d["conf.high"]), 0)))
// 		.range([margin.left, outVisWidth + margin.left]);

// 	if (state_value == 0) {
// 		ypos = 4 * cell.padding;
// 	} else {
// 		ypos = namingDim + 4 * cell.padding;
// 	}

// 	let outcomePlot = results_plot.append("g")
// 		.attr("class", `outcomePanel`)
// 		.attr( "transform",
// 			`translate(0,  ${ypos})`)

// 	outcomePlot.append("line")
// 		.attr("class", "zero-line")
// 		.attr("x1", xscale(0) )
// 		.attr("y1", margin.top)
// 		.attr("x2", xscale(0) )
// 		.attr("y2", height - margin.bottom)
// 		.attr("stroke", `${colors.gray}`)
// 		.attr("stroke-width", 2);

// 	let xAxis = d3.axisTop(xscale)
// 		.ticks(5);

// 	outcomePlot.append("g")
// 		.attr("transform", `translate(0, ${yscale(0) - cell.padding})`)
// 		.call(xAxis)
// 		.style("font-size", "12px");

// 	// add a group for each universe
// 	let panelPlot = outcomePlot.selectAll("g")
// 		.data(data)
// 		.join(
// 			enter => enter.append('g'),
// 			update => update,
// 			exit => exit.remove()
// 		)
// 		.attr("class", "universe");

// 	// Add reference lines
// 	panelPlot.append("line")
// 		.attr("class", "pointrange")
// 		.attr("x1", xscale.range()[0] )
// 		.attr("y1", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
// 		.attr("x2", xscale.range()[1] )
// 		.attr("y2", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
// 		.attr("stroke", `${colors.gray}`)
// 		.attr("stroke-width", 1);

// 	// Add interval lines
// 	panelPlot.append("line")
// 		.attr("class", "pointrange")
// 		.attr("x1", d => xscale(d['conf.low']) )
// 		.attr("y1", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
// 		.attr("x2", d => xscale(d['conf.high']) )
// 		.attr("y2", (d, i) => yscale(i) + yscale.bandwidth() / 2 )
// 		.attr("stroke", `${colors.gray}`)
// 		.attr("stroke-width", 2);

// 	// Add point estimates
// 	panelPlot.append("circle")
// 		.attr("class", "mean")
// 		.attr("cx", d => xscale(d['estimate']))
// 		.attr("cy", (d, i) => yscale(i) + yscale.bandwidth() / 2)
// 		.attr("r", 4)
// 		.attr("fill", `${colors.gray}`);
// }
