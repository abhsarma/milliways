import * as d3 from 'd3';
import { join_options, groupParams, param_order_scale, option_order_scale, store_order, store_pno, store_y  } from './stores.js';
import { cell, groupPadding } from './dimensions.js';
import { whichDiff, any } from './helpers/arrayMethods.js'

let options_to_join;
let x_scale_params;
let x_scale_options;
let sortByGroupParams;
let order;
let param_n_options;
let y;

join_options.subscribe(value => options_to_join=value);
param_order_scale.subscribe(value => x_scale_params=value);
option_order_scale.subscribe(value => x_scale_options=value);
groupParams.subscribe(value => sortByGroupParams=value);
store_order.subscribe(value => order=value);
store_pno.subscribe(value => param_n_options=value);
store_y.subscribe(value => y=value);

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
                let sel = d3.select(this);
                sel.moveToFront();
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
            
            d3.selectAll(`g.option-value.${d[0].parameter}, g.option-headers.${d[0].parameter}`).attr("transform", function(d, i) { 
                return "translate(" + cPosition(d[0].parameter, d[0].index) + ", 0)"; 
            });
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
        transition(d3.select(this)).attr("transform", "translate(" + x_scale_options[d[0].parameter](d[0].index) + ")");
        transition(d3.select(`g.option-value.${d[0].parameter}.${d[0].option}`)).attr("transform", "translate(" + x_scale_options[d[0].parameter](d[0].index) + ")");
    });

// option positions
function cPosition(p, d) {
    var v = option_dragging[d];
    return v == null ? x_scale_options[p](d) : v;
}

/**
// defines drag interaction to re-order 
// parameters (while keeping options in the same order)
**/
export let drag_parameters = d3.drag()
    .subject(function(event, d) {
        return {x: x_scale_params(d)}
    })
    .on("start", function(event, d) {
        target = event.sourceEvent.target.tagName;

        if (target == "DIV") {
            trigger = event.sourceEvent.target.className.split(" ")[1];

            if (trigger == "parameter-name") {
                parameter_dragging[d] = x_scale_params(d);

                // Move the column that is moving on the front
                let sel = d3.select(this);
                sel.moveToFront();
            }
        }
    })
    .on("drag", function(event, d) {
        if (trigger == "parameter-name" & target == "DIV") {
            parameter_dragging[d] = Math.max(
                x_scale_params.range()[0] - 24,
                Math.min(event.x, x_scale_params.range()[x_scale_params.range().length - 2] + 24)
            );

            let parameter_order = Object.entries(param_n_options).sort(function(a, b) { 
                return pPosition(a[0]) - pPosition(b[0]); 
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
            param_order_scale.update(v => v = x_scale_params);

            
            d3.selectAll(`g.parameter`).select('foreignObject')
                .attr("x", d => pPosition(d));
            d3.selectAll(`g.parameter-col`)
                .attr("transform", d => `translate(${pPosition(d)}, ${y(0)})`);
        }
    })
    .on("end", function(event, d) {
        delete parameter_dragging[d];

        let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
        let dividerPositionIndex = d3.select("g.groupedSortDivider").attr("class").split(" ")[1]

        d3.select("g.groupedSortDivider")
            .transition()
            .attr("transform", `translate(${boundaries[dividerPositionIndex]}, 0)`)
            // .attr("transform", boundaries[dividerPositionIndex])

        sortByGroupParams = x_scale_params.domain().slice(dividerPositionIndex).reverse()
        groupParams.update(arr => arr = sortByGroupParams)

        transition(d3.select(`g.parameter-col.${d}`).attr("transform", `translate(${x_scale_params(d)}, ${y(0)})`));
        transition(d3.select(this).select('foreignObject').attr("x", x_scale_params(d)));
    });

// parameter positions
function pPosition(d) {
      var v = parameter_dragging[d];
      return v == null ? x_scale_params(d) : v;
}

/**
// defines drag interaction for the groupedSortDivider
// which defines input to the groupedSortFunction
**/
export let dragSortDivider = d3.drag()
    // .subject(function(event, d) {} )
    .on("start", dividerDragStarted)
    .on("drag", dividerDragged)
    .on("end", dividerDragEnded)


function findClosestDivision(x_value) {
    let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
    var nearest = boundaries.reduce(function(prev, curr) {
        return (Math.abs(curr - x_value) < Math.abs(prev - x_value) ? curr : prev);
  });
  return nearest
}

function dividerDragStarted(event, d) { return null }

function dividerDragged(event, d) {
    let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
    let minBarPosition = boundaries[0];
    let maxBarPosition = boundaries[boundaries.length - 1];

    if (event.x > minBarPosition && event.x < maxBarPosition) {
        d3.select(this).raise().attr("transform", `translate(${event.x}, 0)`);
        d3.select(this).raise().attr("transform", `translate(${event.x}, 0)`);
    }
}

function dividerDragEnded(event, d) {
    let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
    let nearestDivision = findClosestDivision(event.x);
    let dividerPositionIndex = boundaries.indexOf(nearestDivision);

    d3.select(this)
        .attr("class", `groupedSortDivider ${dividerPositionIndex}`)
        .transition()
        .attr("transform", `translate(${nearestDivision}, 0)` )
        .attr("transform", `translate(${nearestDivision}, 0)` )

    sortByGroupParams = x_scale_params.domain().slice(dividerPositionIndex).reverse()
    groupParams.update(arr => arr = sortByGroupParams)
}