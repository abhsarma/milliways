import * as d3 from 'd3';
import { groupParams, param_order_scale, store_pno, store_y  } from './stores.js';
import { cell, groupPadding } from './dimensions.js';

let x_scale_params;
let sortByGroupParams;
let param_n_options;
let y;

param_order_scale.subscribe(value => x_scale_params=value);
groupParams.subscribe(value => sortByGroupParams=value);
store_pno.subscribe(value => param_n_options=value);
store_y.subscribe(value => y=value);

let parameter_dragging = {};
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