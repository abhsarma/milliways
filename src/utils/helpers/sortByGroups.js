import sortByOutcome from "./sortByOutcome"
import { transpose } from 'd3-array';
import { mean, is2dArray } from './arrayMethods.js'


/* {groups, grid_data, outcome_data, estimate_data} -> {grid_data, outcome_data, estimate_data} */

/** 
 * 
 * @param {array} parameters the list of parameters
 * @param {array} gridData Multiverse grid data
 * @param {array} outcomeData Multiverse outcome data
 * @param {array} estimateData Multiverse estimate data
 * @param {boolean} ascending Boolean for ascending or descending
 * @param {boolean} outcomeIndex Index of the outcome we are sorting on
 * 
 * 
 * @return {gridData, outcomeData, estimateData}
 */
function sortByGroup(sortByGroupParams, gridData, outcomeData, estimateData, ascending = false, outcomeIndex = 0) {
	var groups = [...sortByGroupParams]
	if (groups.length == 0) {
		// base (non-recursive) case
		// when there are no groups: groups == []
		// return the output of sort by Outcomes
		let {g_data, o_data, e_data} = sortByOutcome(gridData, outcomeData, estimateData, ascending, outcomeIndex);
		return {g_data, o_data, e_data}
	} else {
		// Step 1:
		// for each parameter in group, if the parameter contains N options
		// partition gridData, outcomeData, estimateData into N data structures
		// and sort each partition

		// determine partition parameter at current recursion level
		let partition_parameter = groups[0]

		// figure out how many partitions to make
		// by getting unique options for that parameter
		// based on the current state of the visualisation (considering joins and exclusions)
		let options = gridData.map(d => JSON.stringify(d[partition_parameter])).filter((v, i, a) => a.indexOf(v) === i);
		let partitions = Array.apply(null, Array(options.length)).map(function () {});

		// make the partitions;
		let [partitioned_g_data, partitioned_o_data, partitioned_e_data] = makePartitions(groups, gridData, outcomeData, estimateData);
		// Step 2: On each partition, we will call SortByGroup, and pass as first argument G = groups / {partition_parameter}

		// update groups to remove partition parameter
		groups = groups.slice(1, groups.length);

		// call sortByGroups on each partition
		let groupedSortResult = partitions.map((d, i) => {
			let {g_data, o_data, e_data} = sortByGroup(groups, partitioned_g_data[i], partitioned_o_data[i], partitioned_e_data[i], ascending, outcomeIndex);
			return {g_data, o_data, e_data}
		}).map(d => {
			if (is2dArray(d.e_data[outcomeIndex])) {
				d.sortingFactor = mean(...d.e_data[outcomeIndex].map(x => mean(...x)));
			} else {
				d.sortingFactor = mean(...d.e_data[outcomeIndex])
			}
			
			return d
		})

		// Step 3:
		// We will then concatenate the N partitioned data structures into a single data structure
		// when concatenating the data structures, we will need to ensure the right order...
		if (ascending) {
			groupedSortResult.sort(function(a, b) {
				return ((a.sortingFactor < b.sortingFactor) ? -1 : ((a.sortingFactor == b.sortingFactor) ? 0 : 1));
			})
		}
		else {
			groupedSortResult.sort(function(a, b) {
				return ((a.sortingFactor > b.sortingFactor) ? -1 : ((a.sortingFactor == b.sortingFactor) ? 0 : 1));
			})
		}

		// Step 4:
		// We will transform the groupedSortResult data structure into 
		// {grid_data, outcome_data, estimate_data} as per our contract
		let g_data = groupedSortResult.map(d => d.g_data).flat(1);

		// outcome data
		// the structure of groupedSortResult.map(d => d.o_data) is:
		// [ [ [ ... (m/p elements)], [], ... (k elements) ], [], ... (p elements) ] 
		// where,
		// 		p is the # of partitions
		//		k is the # of outcomes (# of plots)
		// 		m is the # of universes
		// 
		// desired output: [ [... (m elements)], [], [], ... (k elements) ]
		// 
		// to get this we first need to transpose to get:
		// [ [ [ ... (m/p elements)], [], ... (p elements) ], [], ... (k elements) ]
		// then we can flatten each of [ [ ... (m/p elements)], [], ... (p elements) ] to get what we want
		let o_data = transpose( 
							groupedSortResult.map(d => d.o_data) 
						)
						.map(d => d.flat(1))

		// estimate data
		// the structure is similar to that of o_data, so we follow the same steps
		let e_data = transpose( 
							groupedSortResult.map(d => d.e_data) 
						)
						.map(d => d.flat(1));

		return {g_data, o_data, e_data}
	}
}


function makePartitions(groups, g_data, o_data, e_data) {
	// determine partition parameter at current recursion level
	let partition_parameter = groups[0];

	// figure out how many partitions to make
	// by getting unique options for that parameter
	// based on the current state of the visualisation (considering joins and exclusions)
	let options = g_data.map(d => JSON.stringify(d[partition_parameter])).filter((v, i, a) => a.indexOf(v) === i);

	// make the partitions;
	let partition_indices = options.map(d => 
		g_data.map((x, n) => {
			if (JSON.stringify(x[partition_parameter]) == d) return n
		}).filter(x => x !== undefined)
	);
	
	let partitioned_g_data = partition_indices.map(x =>
		x.map(k => {
			return g_data.map((d, i) => {
				if (k == i) return d
			}).filter(x => x !== undefined)[0]
		})
	)

	// need to take a slightly different approach when it comes to o_data and e_data
	// let o = [outcomes_var1], [outcomes_var2]
	// [o] -> [o | g == g1, o | g == g2, o | g == g3, ...]
	let partitioned_o_data = partition_indices.map(x =>
		o_data.map(y => {
			return x.map(k => {
				return y.map((d, i) => {
					if (k == i) return d
				}).filter(x => x !== undefined)[0]
			})
		})			
	)

	let partitioned_e_data = partition_indices.map(x =>
		e_data.map(y => {
			return x.map(k => {
				return y.map((d, i) => {
					if (k == i) return d
				}).filter(x => x !== undefined)[0]
			})
		})
	)

	return [partitioned_g_data, partitioned_o_data, partitioned_e_data]
}

export default sortByGroup;

