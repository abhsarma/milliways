import * as d3 from 'd3';

//helpers
import combineJoinOptions from './utils/helpers/combineJoinOptions'
import sortByOutcome from './utils/helpers/sortByOutcome.js';
import sortByGroup from './utils/helpers/sortByGroups.js';
import excludeAndCombineOutcomes from './utils/helpers/excludeAndCombineOutcomes.js';
import { exclude_options, exclude_rows, join_options, option_scale } from './utils/stores.js'

// Stores
let options_to_exclude;
// let options_to_join;
let opt_scale;

const e_unsub =  exclude_options.subscribe(value => options_to_exclude=value);
// const j_unsub =  join_options.subscribe(value => options_to_join=value);
const o_unsub = option_scale.subscribe(value => opt_scale=value);

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
		this.parameters = this._parameters();
		this.invParameters = this._invParameters();
		this.optionToIndex = this._optionToIndex();

		// sorting index, initialized to -1 to indicate no default sort
		this.sortByIndex = -1;
		this.sortAscending = true; 
	}

	_parameters = () => {
		// get the parameters from the first row as this is a rectangular dataset
		// is there a better way to do this?
		let param_names = Object.keys(this.data[0]['.parameter_assignment']);


		let dat = this.data.map(d => Object.assign( {}, ...param_names.map((i) => ({[i]: d[i]})) ));

		return Object.assign( {}, ...param_names.map( (x) => ({[x]: d3.groups(dat, d => d[x]).map( i => i[0] )}) ) );
	}

	_invParameters = () => {
		/*
			RETURNS:
				Object
					has format { option : parameter of option, ... }
			NOTE:
				this implicitly assumes unique option names
		*/
		const parameters = this._parameters();
		let inverseParameters = {};
		for (let key in parameters) {
			let arr = parameters[key];
			for (let val of arr)
				inverseParameters[val] = key;
		}
		return inverseParameters;
	}

	_optionToIndex = () => {
		/*
			RETURNS:
				Object
					has format { option : index of option in this.parameters[this.invParameters[option]], ... }
			NOTE:
				optionsToIndex is just for ease of access, used in updateWrapper.
		*/
		const parameters = this._parameters();
		let optionToIndex = {};
		for (let key in parameters) {
			let arr = parameters[key];
			for (let i=0; i<arr.length; i++)
				optionToIndex[arr[i]] = i;
		}
		return optionToIndex;
	}

	// creates the data structure for the grid matrix
	// we will draw this plot as a bar chart
	// input: JSON multiverse object (this.data), parameters (this.parameters)
	// output: rectangular data structure with columns corresponding to each parameter, 
	// 		   estimate, conf.low (if applicable), conf.high (if applicable)
	initializeData = (vis = "CDF") => {
		let parameters = [...Object.keys(this.parameters)];
		options_to_exclude = Object.assign({}, ...parameters.map((i) => ({[i]: []})));
		exclude_options.update(arr => arr=options_to_exclude);

		this.initializeGridData();
		this.initializeOutcomeData();
	}

	initializeGridData = () => {
		// creating a shallow copy which is fine for here
		let parameters = [...Object.keys(this.parameters)];
		let g_data = this.data.map( d => Object.assign({}, ...parameters.map((i) => ({[i]: [d[i]]}))) );
		this.gridData = g_data;
		this.gridDataAll = g_data;
	}

	initializeOutcomeData = () => { // change i here
		let i = this.outcomes.length;
		let term = this.allOutcomeVars[0];
		let e_data, o_data
		let combine = [], exclude = [];

		let option_list = Object.entries(this.parameters).map(d => d[1]);

		this.outcomes.push({
			var: term,
			density: null,
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

		this.outcomes[i].density = o_data_processed;
		this.outcomes[i].estimate = e_data_processed;
	}
	
	updateGridData = (join_data = [], exclude_data = []) => {
		/*
			Updates this.gridData

			PARAMETERS:
				join_data : array[Object(string:?)
					each Object looks like the following:
					{
						indices   : {array[int]}    the indices corresponding to the order displayed on vis
						options   : {array[string]} the options to be joined
						parameter : {string}        the parameter that the options belong to
					}
				exclude_data : Object(string:array[string])
					has format { parameter : options to exclude, ... }
		*/
		let toJoin = structuredClone(join_data);
		let toExclude = structuredClone(exclude_data);
		let combine = combineJoinOptions(toJoin);

		// deep copy data structures
		let g_data = structuredClone(this.gridDataAll);
	
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
	
		if (combine.length > 0 && g_data.length > 0) {
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
	
	updateOutcomeData = (index, term, join_data = [], exclude_data = []) => {		
		// gets a re-intitialzied version of gridData
		let parameters = [...Object.keys(this.parameters)];
		let gridData = this.data.map( d => Object.assign({}, ...parameters.map((i) => ({[i]: [d[i]]}))) );

		let g_data = structuredClone(gridData);
		let o_data = structuredClone(this.outcomes[index].density);
		let e_data
		let toJoin = structuredClone(join_data);
		let toExclude = structuredClone(exclude_data);

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

		let option_list = Object.entries(this.parameters).map(d => d[1]);

		const {o_data_processed, e_data_processed} = excludeAndCombineOutcomes(g_data, o_data, option_list, exclude, combine, e_data);
		this.outcomes[index].density = o_data_processed;
		this.outcomes[index].estimate = e_data_processed;
	}

	updateHandler(join, exclude, excludeRows, sortByGroupParams = []) {		
		// call update grid data
		this.updateGridData(join, exclude);
	
		// call update outcomes
		for (let i in this.outcomes) {
			this.updateOutcomeData(i, this.outcomes[i].var, join, exclude);
		}

		if (excludeRows && excludeRows.length !== 0) {
			const [idx,[low,high]] = excludeRows;

			/*
				TODO: handle joined outcomes. what is desired behavior?
				sort of HACK: this is the reason why we use the index instead of the parameter name.

				As of right now, there is no other way to retrieve the intercept values of a
					particular parameter without doing it this way.
				Also, this.outcomes[idx] may be smaller given we call updateOutcomeData above. If
					there was a way to get the updated version of the outcome data, perhaps in a
					similar fashion with how we handle grid data (this.gridData & this.gridDataAll).
			*/
			let mask = this.outcomes[idx].estimate.map(v => low<=v && v<=high)

			// filter based off of mask
			this.gridData = this.gridData.filter((_,i) => mask[i]);
			this.outcomes = this.outcomes.map((d,_) => {
				d.density = d.density.filter((_,i) => mask[i]);
				d.estimate = d.estimate.filter((_,i) => mask[i]);
				return d;
			});
		}

		if (this.sortByIndex != -1) {
			let outcomeData = this.outcomes.map(d => d.density);
			let estimateData = this.outcomes.map(d => d.estimate);

			// console.log("Calling sort by groups with:", sortByGroupParams)
			const {g_data, o_data, e_data} = sortByGroup(sortByGroupParams, this.gridData, outcomeData, estimateData, this.sortAscending,this.sortByIndex);

			this.gridData = g_data;

			// if we want estimates for only the vector which is being sorted by: e_data[this.sortIndex]
			let temp = this.outcomes.map((d, i) => {
				d.density = o_data[i];
				d.estimate = e_data[i];
				return d;
			});
			this.outcomes = temp;
		}
	}

	updateWrapper(joinOptions=[], excludeOptions=[], excludeRows={}) {
		/*
			Updates the store variables join_options, exclude_options, and exclude_rows which then should be handled elsewhere
			
			PARAMETERS:
				joinArr : array[array[string]]
					array of arrays of length 2 containing options to join
				excludeArr : array[string]
					array of options to exclude
				excludeRows : Object // TODO/IN PROGRESS
					Has format { <parameter> : [<min>,<max>] }
					<min> to <max> is the range of intercept values to exclude based on <parameter>
			TODO:
				bug: for exclude_options, for some reason, the button does not update accordingly
			EXAMPLES:
				Say there are 2 parameters p and q each with 3 options p_1, p_2, p_3 and q_1, q_2, q_3.
				Assuming the options haven't been moved around, some example calls of updateWrapper are

				updateWrapper([ ['p_1','p_2'], ['q_2', q_3'] ]);
					This will join options p_1 and p_2, and it will also join q_2, q_3.

				updateWrapper([ ['p_2','p_1'], ['q_3', q_2'] ]);
					This will behave the same as above.
				
				updateWrapper([ ['p_1', 'p_3'] ]);
					This does nothing, as p_1 and p_3 are not adjacent.
					If p_1 and p_3  are moved in the visualization such that they are adjacent, this will join.
				
				updateWrapper([ ['p_1', 'p_2'], ['p_2', 'p_3'] ]);
					This will join all three options together.

				updateWrapper([ ['p_1, 'p_2'], ['p_1', 'p_3'] ]);
					This will only join p_1 and p_2.
				
				updateWrapper(excludeOptions=['p_1','p_3','q_1']);
					This will exclude the respective options.
				
				updateWrapper([ ['p_1', 'p_2'], ['p_2', 'p_3'] ], ['p_3']);
					This will join all three options, but also exclude p_3
		*/

		// filter excludes option groups that are not valid
		// map produces the proper format
		let join = joinOptions.filter(arr => {
			let x=arr[0], y=arr[1];
			return x in this.invParameters && y in this.invParameters && // checks options exist
				this.invParameters[x] === this.invParameters[y] && // checks options are in the same parameter
				(() => { // checks options are visually next to each other in the mv vis document
					let param = this.invParameters[x]
					let ix = opt_scale[param].domain().indexOf(this.optionToIndex[x]),
					    iy = opt_scale[param].domain().indexOf(this.optionToIndex[y]);
					return Math.abs(ix-iy) === 1; // also ensures x !== y
				})();
		}).map(arr => {
			let x=arr[0], y=arr[1];
			let param = this.invParameters[x];
			return {
				indices: [opt_scale[param].domain().indexOf(this.optionToIndex[x]),
						  opt_scale[param].domain().indexOf(this.optionToIndex[y])],
				options: arr,
				parameter: param
			}
		});
		
		excludeOptions = Array.from(new Set(excludeOptions)); // remove duplicates
		let exclude = {};
		for (let key in this.parameters) exclude[key] = [];
		for (let option of excludeOptions) {
			if (option in this.invParameters)
				exclude[this.invParameters[option]].push(option);
		}

		// TODO: implement excludeRows
		// Problem comes in when user desires to exclude rows based on a parameter not present in vis

		// by updating these, it should reactively call this.updateHandler elsewhere (App.svelte)
		join_options.update(_ => join);
		exclude_options.update(_ => exclude);
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