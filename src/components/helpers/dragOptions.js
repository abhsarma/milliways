import * as d3 from 'd3';
import { join_options, param_order_scale, option_order_scale } from '../stores.js';
import { colors } from '../colorPallete.js';	
import { arrayEqual, whichDiff, any } from './arrayMethods.js'

let options_to_join, x_scale_params, x_scale_options;
let option_dragging = {}, previous_option_order = {}, parameter_dragging = {};
let target, trigger;

const j_unsub =  join_options.subscribe(value => options_to_join=value);
const pos_unsub = param_order_scale.subscribe(value => x_scale_params=value);
const oos_unsub = option_order_scale.subscribe(value => x_scale_options=value);

/**
 * 
 * @param {event} d3 event
 * @param {d} data binding to option which is being interacted with
 **/
function optionDragStart(event, d) {
	target = event.sourceEvent.target.tagName;
	previous_option_order[d[0].index] = x_scale_options[d[0].parameter].domain();

	if (target == "DIV") {
		trigger = event.sourceEvent.target.className.split(" ")[0];
		if (trigger == "option-label") {
			option_dragging[d[0].index] = x_scale_options[d[0].parameter](d[0].index);

			// Move the column that is moving on the front
			let sel = d3.select(this);
			sel.moveToFront();
		}
	}
}

/**
 * 
 * @param {event} d3 event
 * @param {d} data binding to option which is being interacted with
 **/
function optionDragged(event, d) {
	if (trigger == "option-label" & target == "DIV") {
		option_dragging[d[0].index] = Math.min(
			x_scale_options[d[0].parameter].range()[1],
			Math.max(-x_scale_options[d[0].parameter].bandwidth(), (event.x - x_scale_params(d[0].parameter)))
		);

		order[d[0].parameter].name.sort(function(a, b) { return cPosition(d[0].parameter, a) - cPosition(d[0].parameter, b); });
		x_scale_options[d[0].parameter].domain(order[d[0].parameter].name);
		option_order_scale.update(v => v = x_scale_options);

		d3.selectAll(`g.option-value.${d[0].parameter}`).attr("transform", function(d, i) { 
			return "translate(" + cPosition(d[0].parameter, d[0].index) + ", 0)"; 
		});
	}
}

/**
 * 
 * @param {event} d3 event
 * @param {d} data binding to option which is being interacted with
 **/
function optionDragEnd (event, d) {
	// step 1: check if the order of the options (within the current parameter) has changed at all
	// if (!arrayEqual(previous_option_order[d[0].index], order[d[0].parameter].name)) { 
	let current_param_joined = options_to_join
								.filter(x => (x.parameter == d[0].parameter))
								.map(d => d.indices).flat();

	// step 1: which option indices have changed?
	let diff_indices = whichDiff(previous_option_order[d[0].index], order[d[0].parameter].name);

	// step 2: check if drag has impacted the positions of any of the joined parameters
	if (any(...diff_indices.map(d => current_param_joined.includes(d)).flat())) {
		// step 3: un-join...by updating options_to_join and the store

		// step 3.1 remove the current dragged option, if it is *joined*
		//options_to_join.filter( i => !i['options'].includes(d[0].option) );

		// step 3.2 remove all options which are impacted by the drag
		options_to_join = options_to_join.filter(d => !any(...diff_indices.map(x => d['indices'].includes(x))))
		join_options.update(arr => arr = options_to_join);
	}

	delete option_dragging[d[0].index];
	transition(d3.select(this)).attr("transform", "translate(" + x_scale_options[d[0].parameter](d[0].index) + ")");
}

// option positions
function cPosition(p, d) {
	var v = option_dragging[d];
	return v == null ? x_scale_options[p](d) : v;
}


export { optionDragStart, optionDragged, optionDragEnd }