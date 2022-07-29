import * as d3 from 'd3';
import { groupParams, param_order_scale  } from './stores.js';
import { groupPadding } from './dimensions.js';

let x_scale_params;
let sortByGroupParams;

param_order_scale.subscribe(value => x_scale_params=value);
groupParams.subscribe(value => sortByGroupParams=value);

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
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