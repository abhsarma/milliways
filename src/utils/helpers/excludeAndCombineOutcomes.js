import { min, max, rollups, groups } from 'd3-array';
import { select, selectAll } from 'd3-selection';

function which_option_index(option_list, universe_specification) {
	// check if option_list and universe_specification is of the same length
	// else throw error
	if ( ! (option_list.length == universe_specification.length) ) {
		throw new Error('provided variables are not of the same length')
	}

	return option_list.map((d, i) => d.indexOf(universe_specification[i]))
}

// function calculate_mirror_CDF(d1, d2, size) {
// 	if (d1 > 0.5 & d2 > 0.5) { d1 = (1 - d1); d2 = (1 - d2)}
// 	else {
// 		if (d2 > 0.5 & (1 - d2) > d1) { d2 = 0.5 }
// 		else if (d2 > 0.5 & (1 - d2) < d1) { d2 = (1 - d2); d1 = 0.5}
// 	}

// 	if (d1 < d2) { return [d1, d2] }
// 	else { return [d2, d1] }
// }

function calculate_pbox(d1, d2, size) {
	// by design, d1 < d2
	// as x increases, we will see:
	// (1) d2, d1 <= 0.5
	// (2) d2 > 0.5 and d1 <= 0.5
	// (3) d2, d1 > 0.5

	let dd1, dd2 // represent the mirrored density values
	let box1, box2 // represent the lower and upper limits of the p-box

	dd1 = d1; dd2 = d2;
	if (d1 > 0.5) dd1 = 1 - d1;
	if (d2 > 0.5) dd2 = 1 - d2;

	if (d1 <= 0.5 & d2 <= 0.5) {
		box1 = d1;
		box2 = d2;
	} else if (d2 > 0.5 & d1 <= 0.5) {
		if (d1 <= dd2) {
			box1 = d1;
			box2 = 0.5;
		} else {
			box1 = dd2;
			box2 = 0.5;
		}
	} else if (d1 > 0.5 & d2 > 0.5) {
		box2 = dd1;
		box1 = dd2;
	}

	else if (d1 > 0.5 & d2 <= 0.5) {
		// throw error;
		throw new Error('d1 > d2; this should not be happening')
	} else {
		// throw error;
		throw new Error('unknown behavior for d1 and d2')
	}

	if (box1 == undefined || box2 == undefined) {
		throw new Error('p-box values are undefined')
	}

	return [box1, box2];
}

/**
 * function which processes the result of exclusion and combinations of options on outcomes (CDF and estimate); returns the processed outcomeData (CDF) and estimateData (point estimate) objects
 * 
 * @param {object} g_data Multiverse grid data
 * @param {object} o_data Multiverse outcome data
 * @param {array} option_list 2D array of parameters and their options
 * @param {object} combine 2D array containing [paramter, [options_to_join]]
 * @param {array} exclude List of objects containing {parameter, option} to exclude
 * @param {object} e_data Estimate data for each of the outcomes
 * 
 * 
 * @return {object} an object containing processed outcome and estimate data arrays: {o_data, e_data}
 **/
function excludeAndCombineOutcomes (g_data, o_data, option_list, exclude, combine, e_data) {
	let size = g_data.length;
	let o_data_processed = o_data;
	let e_data_processed = e_data;
	
	let group_by = combine.map(d => d[1].map(x => ([d[0], x])))
							.flat()
							.map((d, i) => (Object.assign({}, {id: i}, {parameter: d[0]}, {group: d[1].flat()})));
	
	// if there are any options to exclude
	if (exclude.length > 0) {
		let toFilter = g_data.map(j => exclude.map(i => j[i['parameter']] != i['option']).reduce((a, b) => (a && b)));

		g_data = g_data.filter( (i, n) => toFilter[n] );
		o_data_processed = o_data.filter( (i, n) => toFilter[n] );
		e_data_processed = e_data.filter( (i, n) => toFilter[n] );
	}

	if (combine.length > 0) {
		let group_by = combine.map(d => d[1].map(x => ([d[0], x])))
							.flat()
							.map((d, i) => (Object.assign({}, {id: i}, {parameter: d[0]}, {group: d[1].flat()})));
		
		// the grouping vector is used to indicate which 
		// of the universes are being joined
		let grouping_vector = g_data.map((d, i) => {
			let options = Object.values(d).flat(); // option names for the specification that comprises this universe
			let parameters = Object.keys(d).flat(); // option names for the specification that comprises this universe

			// gets the indices of options in option_list corresponding to this particular specification
			// idx should always have length == parameters.length
			let idx = which_option_index(option_list, options)

			// g is an array of length group_by.length
			// each element in g is an array of length 2: 
			// the first element is the index of the parameter whose options are being joined, 
			// and the second element is the id from group_by
			let g = group_by
				.map(x => {
					let match_options = options.map(d => x['group'].includes(d)) // identifies whether the option has been joined only based on the option name
					let match_parameter = parameters.map(d => d == x.parameter) // identifies whether the option has been joined only based on the option name
					let includes = match_options.map((d, i) => d && match_parameter[i]);
					return [includes.indexOf(true), x['id']];
				})

			// for each universe specification, g indicates which parameter has an option being joined and which `id` in groups this join operation corresponds to
			g.forEach(x => {
				if (x[0] > -1) {
					idx[x[0]] = size + x[1]
				}
			})
			
			// we use this information to create idx for each universe specification which will be used to actually join universe specifications
			return JSON.stringify(idx);
		});
		
		let o_data_preprocessed = groups(
			o_data_processed.map((d, i) => ({group: grouping_vector[i], data: d})),
				d => d.group
			)

		o_data_processed = o_data_preprocessed.map(d => d[1].map(x => {
				delete x.group;
				return Object.values(x).flat();
			})).map((x, universe) => {
				let mod = rollups(x.flat(), v => {
					return calculate_pbox(...[min(v, d => d[1]), max(v, d => d[1])], o_data_preprocessed.length);
				}, d => d[0]);
				return mod
			})
			.map(x => x.map(p => p.flat()));

		e_data_processed = groups(
			e_data_processed.map((d, i) => ({group: grouping_vector[i], data: d})),
				d => d.group
			).map(d => d[1].map(x => {
				delete x.group;
				return Object.values(x).flat();
			}).flat())
	} else {
		o_data_processed = o_data_processed.map( d => d.map( x => {
			if (x[1] > 0.5) { x[1] = (1 - x[1]) }
			if (x[2] > 0.5) { x[2] = (1 - x[2]) }	
			return x
		}) )
	}

	return {e_data_processed, o_data_processed};
}

export default excludeAndCombineOutcomes