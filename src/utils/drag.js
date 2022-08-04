import * as d3 from 'd3';
import { join_options, group_params, parameter_scale, option_scale } from './stores.js';
import { cell, margin, gridNamesHeight, groupPadding } from './dimensions.js';
import { whichDiff, any } from './helpers/arrayMethods.js'

let options_to_join;
let x_scale_params;
let x_scale_options;
let sortByGroupParams;

join_options.subscribe(value => options_to_join=value);
parameter_scale.subscribe(value => x_scale_params = value);
option_scale.subscribe(value => x_scale_options = value);
group_params.subscribe(value => sortByGroupParams=value);

let option_dragging = {}, previous_option_order = {}, parameter_dragging = {};
let target, trigger;

d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
}

function transition(g) {
	return g.transition().duration(500);
}

/**
// defines drag interaction to re-order 
//  options within each parameter
**/
export let drag_options = (order) => d3.drag()
	.subject(function(event) {
		let parameter = this.className.baseVal.split(' ')[1]
		let index = this.className.baseVal.split(' ')[3].split('-')[1]

		return {x: x_scale_params(parameter) + x_scale_options[parameter](index)}
	})
	.on("start", function(event) {
		let parameter = this.className.baseVal.split(' ')[1]
		let index = this.className.baseVal.split(' ')[3].split('-')[1]

		target = event.sourceEvent.target.tagName;
		previous_option_order[index] = x_scale_options[parameter].domain();

		if (target == "DIV") {
			trigger = event.sourceEvent.target.className.split(" ")[0];
			if (trigger == "option-label") {
				option_dragging[index] = x_scale_options[parameter](index);

				// Move the column that is moving on the front
				d3.select(this).moveToFront();
				d3.select(`g.option-value.${parameter}.option-${index}`).moveToFront();
			}
		}
	})
	.on("drag", function(event) {
		let parameter = this.className.baseVal.split(' ')[1]
		let index = this.className.baseVal.split(' ')[3].split('-')[1]


		if (trigger == "option-label" & target == "DIV") {
			option_dragging[index] = Math.min(
				x_scale_options[parameter].range()[1],
				Math.max(-x_scale_options[parameter].bandwidth(), (event.x - x_scale_params(parameter)))
			);

			order[parameter].name.sort(function(a, b) { return cPosition(parameter, a, x_scale_options) - cPosition(parameter, b, x_scale_options); });
			x_scale_options[parameter].domain(order[parameter].name);
			option_scale.update(v => v = x_scale_options);
			
			d3.selectAll(`g.option-value.${parameter}, g.option-headers.${parameter}`).attr("transform", function(d) { 
				let p = this.className.baseVal.split(' ')[1]
				let i = this.className.baseVal.split(' ')[3].split('-')[1]
				return `translate(${cPosition(p, i, x_scale_options)}, 0)`; 
			});
		}
	})
	.on("end", function(event) {
		let parameter = this.className.baseVal.split(' ')[1]
		let option = this.className.baseVal.split(' ')[2]
		let index = this.className.baseVal.split(' ')[3].split('-')[1]

		// step 1: check if the order of the options (within the current parameter) has changed at all
		// if (!arrayEqual(previous_option_order[d[0].index], order[d[0].parameter].name)) { 
		let current_param_joined = options_to_join
									.filter(x => (x.parameter == parameter))
									.map(d => d.indices).flat();

		// step 1: which option indices have changed?
		let diff_indices = whichDiff(previous_option_order[index], order[parameter].name);

		// step 2: un-join...by updating options_to_join and the store
		options_to_join = options_to_join.filter(x => 
			!((x.parameter == parameter) && // step 2.1 check if indices are correspond to the parameter being interacted with
				any(...diff_indices.map(v => x.indices.includes(v)))) // step 2.2 if yes, remove the indices which differ in position
		);
		join_options.update(arr => arr = options_to_join);
		
		delete option_dragging[index];
		transition(d3.select(this)).attr("transform", "translate(" + x_scale_options[parameter](index) + ")");
		transition(d3.select(`g.option-value.${parameter}.${option}`)).attr("transform", "translate(" + x_scale_options[parameter](index) + ")");
	});


// option positions
function cPosition(p, d, x_scale_options) {
	var v = option_dragging[d];
	return v == null ? x_scale_options[p](d) : v;
}

/**
// defines drag interaction to re-order 
// parameters (while keeping options in the same order)
**/
export let drag_parameters = (param_n_options, y) => d3.drag()
	.subject(function(event) {
		let d = this.className.baseVal.split(' ')[1]
		return {x: x_scale_params(d)}
	})
	.on("start", function(event) {
		let d = this.className.baseVal.split(' ')[1]
		target = event.sourceEvent.target.tagName;

		if (target == "DIV") {
			trigger = event.sourceEvent.target.className.split(" ")[0];

			if (trigger == "parameter-name") {
				parameter_dragging[d] = x_scale_params(d);

				// Move the column that is moving on the front
				d3.select(this).moveToFront();
				d3.selectAll(`g.parameter-col.${d}`).moveToFront();
			}
		}
	})
	.on("drag", function(event) {
		let d = this.className.baseVal.split(' ')[1]

		if (trigger == "parameter-name" & target == "DIV") {
			parameter_dragging[d] = Math.max(
				x_scale_params.range()[0] - 24,
				Math.min(event.x, x_scale_params.range()[x_scale_params.range().length - 2] + 24)
			);

			let parameter_order = Object.entries(param_n_options).sort(function(a, b) { 
				return pPosition(a[0], x_scale_params) - pPosition(b[0], x_scale_params); 
			});
			let param_order_range = parameter_order.map(d => d[1])
				.reduce( (acc, val, index) => {
					if (index == 0) {
						acc.push(0);
						acc.push(val); // acc.push([val[0], val[1]]);
					} else {
						acc.push(val + acc[acc.length - 1]); // acc.push([val[0], val[1] + acc[acc.length - 1][1]]);
					}
					return acc; 
				}, [] )
				.reduce((a, v, i, arr) => {
					if (i > 0) {
						let opts = (arr[i] - arr[i - 1])
						a.push(opts * cell.width + (opts - 1) * cell.padding + groupPadding + a[i - 1])
					} else {
						a.push(groupPadding)
					}
					return a;
				}, []);

			x_scale_params.domain(parameter_order.map(d => d[0]));
			x_scale_params.range(param_order_range);
			parameter_scale.update(v => v = x_scale_params);
			
			d3.select('svg.grid-header').selectAll('g.parameter').select('foreignObject')
				.attr("x", function(d) {
					let p = this.parentNode.className.baseVal.split(' ')[1]
					return pPosition(p, x_scale_params)
				});
			d3.select('svg.grid-header').selectAll(`g.parameter-col`)
				.attr("transform", function(d) {
					let p = this.className.baseVal.split(' ')[1]
					return `translate(${pPosition(p, x_scale_params)}, ${margin.top})`
				});
			d3.select('svg.grid-body').selectAll(`g.parameter-col`)
				.attr("transform", function(d) {
					let p = this.className.baseVal.split(' ')[1]
					return `translate(${pPosition(p, x_scale_params)}, ${gridNamesHeight})`
				});
		}
	})
	.on("end", function(event) {
		let d = this.className.baseVal.split(' ')[1]

		delete parameter_dragging[d];

		let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
		let dividerPositionIndex = d3.select("g.grouped-sort-divider").attr("class").split(" ")[1];

		d3.select("g.grouped-sort-divider")
			 .transition()
			 .attr("transform", `translate(${boundaries[dividerPositionIndex]}, 0)`)
			 // .attr("transform", boundaries[dividerPositionIndex])

		sortByGroupParams = x_scale_params.domain().slice(dividerPositionIndex).reverse()
		group_params.update(arr => arr = sortByGroupParams)

		transition(d3.select('svg.grid-header').select(`g.parameter-col.${d}`).attr("transform", `translate(${x_scale_params(d)}, ${margin.top})`));
		transition(d3.select('svg.grid-body').select(`g.parameter-col.${d}`).attr("transform", `translate(${x_scale_params(d)}, ${gridNamesHeight})`));
		transition(d3.select(this).select('foreignObject').attr("x", x_scale_params(d)));
	});

// parameter positions
function pPosition(d, x_scale_params) {
	var v = parameter_dragging[d];
	return v == null ? x_scale_params(d) : v;
}

/**
// defines drag interaction for the grouped-sort-divider
// which defines input to the groupedSortFunction
**/
export let dragSortDivider = () => d3.drag()
	// .subject(function(event, d) {} )
	.on("start", function(event) { 
		return null 
	})
	.on("drag", function(event) { 
		let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
		let minBarPosition = boundaries[0];
		let maxBarPosition = boundaries[boundaries.length - 1];

		if (event.x > minBarPosition && event.x < maxBarPosition) {
			d3.select(this).raise().attr("transform", `translate(${event.x}, 0)`);
			d3.select(this).raise().attr("transform", `translate(${event.x}, 0)`);
		}
	})
	.on("end", function(event) { 
		let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
		let nearestDivision = findClosestDivision(event.x, x_scale_params);
		let dividerPositionIndex = boundaries.indexOf(nearestDivision);

		d3.select(this)
			.attr("class", `grouped-sort-divider ${dividerPositionIndex}`)
			.transition()
			.attr("transform", `translate(${nearestDivision}, 0)` )
			.attr("transform", `translate(${nearestDivision}, 0)` )

		sortByGroupParams = x_scale_params.domain().slice(dividerPositionIndex).reverse()
		group_params.update(arr => arr = sortByGroupParams)
	})


function findClosestDivision(x_value) {
	let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
	var nearest = boundaries.reduce(function(prev, curr) {
		return (Math.abs(curr - x_value) < Math.abs(prev - x_value) ? curr : prev);
  });
  return nearest
}