import * as d3 from 'd3';

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
export let drag_options = d3.drag()
	.subject(function(event, d) {
		return {x: x_scale_params(d[0].parameter) + x_scale_options[d[0].parameter](d[0].index)}
	})
	.on("start", function(event, d) {
		target = event.sourceEvent.target.tagName;
		previous_option_order[d[0].index] = x_scale_options[d[0].parameter].domain();

		if (target == "DIV") {
			trigger = event.sourceEvent.target.className.split(" ")[0];
			if (trigger == "option-label") {
				option_dragging[d[0].index] = x_scale_options[d[0].parameter](d[0].index);

				// Move the column that is moving on the front
				d3.select(this).moveToFront();
			}
		}
	})
	.on("drag", function(event, d) {
		if (trigger == "option-label" & target == "DIV") {
			option_dragging[d[0].index] = Math.min(
				x_scale_options[d[0].parameter].range()[1],
				Math.max(-x_scale_options[d[0].parameter].bandwidth(), (event.x - x_scale_params(d[0].parameter)))
			);

			order[d[0].parameter].name.sort(function(a, b) { return cPosition(d[0].parameter, a) - cPosition(d[0].parameter, b); });
			x_scale_options[d[0].parameter].domain(order[d[0].parameter].name);
			option_order_scale.update(v => v = x_scale_options);
			
			d3.selectAll(`g.option-value.${d[0].parameter}, g.option-headers.${d[0].parameter}`)
				.attr("transform", (d, i) => `translate(${cPosition(d[0].parameter, d[0].index)}, 0)`);
		}
	})
	.on("end", function(event, d) {
		// step 1: check if the order of the options (within the current parameter) has changed at all
		// if (!arrayEqual(previous_option_order[d[0].index], order[d[0].parameter].name)) { 
		let current_param_joined = options_to_join
									.filter(x => (x.parameter == d[0].parameter))
									.map(d => d.indices).flat();

		// step 1: which option indices have changed?
		let diff_indices = whichDiff(previous_option_order[d[0].index], order[d[0].parameter].name);

		// step 2: un-join...by updating options_to_join and the store
		options_to_join = options_to_join.filter(x => 
			!((x.parameter == d[0].parameter) && // step 2.1 check if indices are correspond to the parameter being interacted with
				any(...diff_indices.map(v => x.indices.includes(v)))) // step 2.2 if yes, remove the indices which differ in position
		);
		join_options.update(arr => arr = options_to_join);
		
		delete option_dragging[d[0].index];
		transition(d3.select(this))
			.attr("transform", `translate(${x_scale_options[d[0].parameter](d[0].index)}, 0)`);
		transition(d3.select(`g.option-value.${d[0].parameter}.${d[0].option}`))
			.attr("transform", `translate(${x_scale_options[d[0].parameter](d[0].index)}, 0)`);
	});

// option positions
function cPosition(p, d) {
	var v = option_dragging[d];
	return v == null ? x_scale_options[p](d) : v;
}