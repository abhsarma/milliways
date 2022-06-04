import * as d3 from 'd3';

function which_option_index(option_list, curr_options) {
	return option_list.map((d, i) => {
		if (curr_options.includes(d)) {
			return i;
		} else {
			return null;
		}
	}).filter(i => (i != null))
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
	let o_data_processed = o_data
	let e_data_processed = e_data
	
	let groups = combine.map(d => d[1].map(x => ([d[0], x])))
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
		let groups = combine.map(d => d[1].map(x => ([d[0], x])))
							.flat()
							.map((d, i) => (Object.assign({}, {id: i}, {parameter: d[0]}, {group: d[1].flat()})));
		// 
		let grouping_vector = g_data.map((d, i) => {
			let options = Object.values(d).flat();
			let idx = option_list.map(x => which_option_index(x, options)).flat();
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
		
		o_data_processed = d3.groups(
			o_data_processed.map((d, i) => ({group: grouping_vector[i], data: d})),
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

		e_data_processed = d3.groups(
			e_data_processed.map((d, i) => ({group: grouping_vector[i], data: d})),
				d => d.group
			).map(d => d[1].map(x => {
				delete x.group;
				return Object.values(x).flat();
			}).flat())
	}

	return {e_data_processed, o_data_processed};
}

export default excludeAndCombineOutcomes