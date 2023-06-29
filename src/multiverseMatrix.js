import { range, extent, groups, zip, max, histogram } from 'd3-array';
import { scaleLinear } from 'd3-scale';

//helpers
import combineJoinOptions from './utils/helpers/combineJoinOptions'
import sortByOutcome from './utils/helpers/sortByOutcome.js';
import sortByGroup from './utils/helpers/sortByGroups.js';
import excludeAndCombineOutcomes from './utils/helpers/excludeAndCombineOutcomes.js';
import { exclude_options, exclude_rows, join_options, option_scale, parameter_scale, group_params } from './utils/stores.js'
import { groupPadding } from './utils/dimensions.js';

// Stores
let options_to_exclude;
// let options_to_join;
let opt_scale;
let x_scale_params;
let sortByGroupParams;

const e_unsub =  exclude_options.subscribe(value => options_to_exclude=value);
// const j_unsub =  join_options.subscribe(value => options_to_join=value);
const o_unsub = option_scale.subscribe(value => opt_scale=value);
parameter_scale.subscribe(value => x_scale_params = value);
group_params.subscribe(value => sortByGroupParams=value);

class multiverseMatrix {
	constructor (dat) {		
		// data for the plot constructor
		this.data = dat;

		// meta data for the multiverse object
		this.universes = [...new Set(dat.map(d => d['.universe']))];
		this.size = this.universes.length;
		this.allOutcomeVars = dat[0]["results"].map(i => i["term"]);
		this.outcomes = []; //[this.allOutcomeVars[0]];
		this.estimates = [];
		this.gridData = null;
		this.gridDataAll = null;
		this.parameters = this._parameters();
		this.invParameters = this._invParameters();
		this.optionToIndex = this._optionToIndex();

		// sorting index, initialized to 0 to indicate ascending sort on the first visible panel
		this.sortByIndex = 0;
		this.sortAscending = true; 
	}

	_parameters = () => {
		// get the parameters from the first row as this is a rectangular dataset
		let param_names = Object.keys(this.data[0]).filter(x => !(x == ".universe" || x == "results" || x == ".parameter_assignment"));

		let dat = this.data.map(d => Object.assign( {}, ...param_names.map((i) => ({[i]: d[i]})) ));

		return Object.assign( {}, ...param_names.map( (x) => ({[x]: groups(dat, d => d[x]).map( i => i[0] )}) ) );
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
		o_data = formattedCDFOutcomeData.map((d, n) => zip(d['cdf.x'], d['cdf.y'], d['cdf.y']))
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
		// 	o_data = formattedCDFOutcomeData.map((d, n) => zip(d['cdf.x'], d['cdf.y'], d['cdf.y']))
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

		let limits = extent(o_data_processed[0].map(d => d[0]));
		let histGeom = histogram()
			.value(function(d) { return d; })   //  provide a vector of values
			.domain(limits)  // then the domain of the graphic
			.thresholds(scaleLinear().domain(limits).ticks(70)); // the numbers of bins
		let bins = histGeom(e_data_processed.flat());

		this.outcomes[i].density = o_data_processed;
		this.outcomes[i].estimate = e_data_processed;
		this.outcomes[i].mode = max(bins, function(d) { return d.length; })
		this.estimates[i] = e_data_processed;
	}
	
	updateGridData = (join_data = [], exclude_data = {}) => {
		/*
			Updates this.gridData

			PARAMETERS:
				join_data : array[Object(string:?)]
					each Object looks like the following:
					{
						indices   : {array[int]}    the indices corresponding to the order displayed on vis
						options   : {array[string]} the options to be joined
						parameter : {string}        the parameter that the options belong to
					}
				exclude_data : Object(string:array[string])
					has format { parameter : {array[string]} the options to be excluded }
		*/
		let toJoin = structuredClone(join_data);
		let toExclude = structuredClone(exclude_data);
		let combine = combineJoinOptions(toJoin);
		
		// deep copy data structures
		let g_data = structuredClone(this.gridDataAll);
	
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
		

			// vec is a modified version of g_data where the options (say op1, op2) 
			// which are joined are replaced by an array [op1, op2]
			let vec = g_data.map((d, i) => {
				// let options = Object.values(d).flat();
				let g = groups.forEach(x => {
						let options = d[x['parameter']];
						let includes = options.map(y => x['group'].includes(y)).reduce((a, b) => (a || b));
						if (includes) {
							d[x['parameter']] = x['group']
						}
					})
				return d
			});

			// vec.map((d, i) => {
			// 	console.log(i, d);
			// })

			// console.log(vec)
	
			let duplicates_data = vec.map(d => JSON.stringify(Object.values(d).flat()));
	
			let non_duplicates = duplicates_data.map((d, i) => {
				// console.log(d, duplicates_data.indexOf(d), i)
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
		o_data = formattedCDFOutcomeData.map((d, n) => zip(d['cdf.x'], d['cdf.y'], d['cdf.y']));
		e_data = formattedCDFOutcomeData.map((d,n)=>d['estimate']);

		let option_list = Object.entries(this.parameters).map(d => d[1]);

		const {o_data_processed, e_data_processed} = excludeAndCombineOutcomes(g_data, o_data, option_list, exclude, combine, e_data);
		this.outcomes[index].density = o_data_processed;
		this.outcomes[index].estimate = e_data_processed;
		this.estimates[index] = e_data_processed;
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

			let mask; // used to filter out which rows should be included or not
			if (join && join.length !== 0) {
				mask = this.outcomes[idx].estimate.map(arr => {
					const mn = Math.min(...arr),
						  mx = Math.max(...arr);
					const v = mn + (mx - mn)/2;
					return low<=v && v<=high; // compares to the middle of the min and max
				});
			}
			else
				mask = this.outcomes[idx].estimate.map(v => low<=v && v<=high);

			// check if mask is empty
			if (mask.reduce((a, b) => a + b)) {
				// filter based off of mask
				this.gridData = this.gridData.filter((_,i) => mask[i]);
				this.outcomes = this.outcomes.map((d,_) => {
					d.density = d.density.filter((_,i) => mask[i]);
					d.estimate = d.estimate.filter((_,i) => mask[i]);
					return d;
				});
			}
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

	setInteractions(joinOptions={}, excludeOptions=[], excludeRows={}, sliderPosition=Object.keys(this.parameters).length) {
		/*
			Allows you to functionally call interactions join options, exclude options and exclude rows
			
			PARAMETERS:
				joinArr : {'parameter': array[string]}
					Object of arrays containing list of options to join
				excludeArr : array[string]
					array of options to exclude
				excludeRows : Object
					Has format
					{ 
						outcomeVar : <outcomeVar> (string)
						range      : [<min>, <max>] ([number, number])
					}
					<min> to <max> is the range of intercept values to exclude based on <outcomeVar>
					NOTE: the outcomeVar must be visually on the visualization
				sliderPosition : Number
					index of where to place slider. 0 <= sliderPosition <= this.size
			EXAMPLES:
				Let there be 2 parameters p and q each with 3 options p_1, p_2, p_3 and q_1, q_2, q_3.
				Let there be 2 outcome variables o_1, o_2 and only o_1 is shown on the vis.
				Assuming the parameters & options haven't been moved around, some example calls are

				m.setInteractions([ ['p_1', 'p_2'], ['q_2', 'q_3'] ]);
					This will join options p_1 and p_2, and it will also join q_2, q_3.

				m.setInteractions([ ['p_2','p_1'], ['q_3', q_2'] ]);
					This will behave the same as above.
				
				m.setInteractions([ ['p_1', 'p_3'] ]);
					This does nothing, as p_1 and p_3 are not adjacent.
					If p_1 and p_3  are moved in the visualization such that they are adjacent, this will join.
				
				m.setInteractions([ ['p_1', 'p_2'], ['p_2', 'p_3'] ]);
					This will join all three options together.

				m.setInteractions([ ['p_1, 'p_2'], ['p_1', 'p_3'] ]);
					This will only join p_1 and p_2.
				
				m.setInteractions(excludeOptions=['p_1','p_3','q_1']);
					This will exclude the respective options.
				
				m.setInteractions([ ['p_1', 'p_2'], ['p_2', 'p_3'] ], ['p_3']);
					This will join all three options, but also exclude p_3

				m.setInteractions(excludeRows={ outcomeVar: "o_1", range: [4.123, 4.987] })
					Only the rows such that the intercept value for o_1 is between 4.123 and 4.987 are included.

				m.setInteractions(excludeRows={ outcomeVar: "o_1", range: ["4.123", "4.987"] })
					This does nothing as the elements in range are not the right type.

				m.setInteractions(excludeRows={ outcomeVar: "o_1", range: [0] })
					This does nothing as range is not in the right format.

				m.setInteractions(excludeRows={ outcomeVar: "o_2", range: [0,0.5] })
					This does nothing as o_2 is not being visualized.
				
				m.setInteractions(excludeRows={ outcomeVar: "o_3", range: [1,2] })
					This does nothing as o_3 does not exist.

				m.setInteractions(sliderPosition=0)
					This moves the slider to the 0th position (before the 1st parameter).

				m.setInteractions(sliderPosition=2)
					This moves the slider to the 2nd position (after the 2nd parameter).
				
				m.setInteractions(sliderPosition=3)
					This does nothing as there is no 3rd position.

				m.setInteractions(sliderPosition=1.3)
					This does nothing as this is not an integer.
		*/

		// --- ERROR CHECK ---

		// isPureObject checks if val is a pure JS Object, as in not an array, not a class, etc.
		// NOTE: technically fails in cases like 
		// 		 `val == { constructor : 1 }` or `Object.create(null)`
		// 		 but it should be fine in our case
		const isPureObject = val => typeof val === 'object' && val.constructor.name == 'Object';

		// -- joinOptions --

		// Checks joinOptions follows {parameter: array[string], ...}
		if (!isPureObject(joinOptions) ||
			!Object.values(joinOptions).every(arr => Array.isArray(arr) && arr.every(val => typeof val === 'string'))
		) {
			throw new Error('Argument joinOptions should be of the form: {parameter: array[string], ...}')
		}

		// -- excludeOptions --

		// Checks that excludeOptions is array and every element is a string
		// Note that it is true even when excludeOptions === []
		if (!Array.isArray(excludeOptions) || !excludeOptions.every(val => typeof val === 'string')) {
			throw new Error(`Argument excludeOptions should be of form: array[string] (given ${excludeOptions})`)
		}

		// -- excludeRows --

		// checks type of excludeRows
		if (!isPureObject(excludeRows)) {
			throw new Error(`Argument excludeRows should be of form { outcomeVar : <string> , range : <array> } (given ${excludeRows})`);
		}
		// checks if both values exist (since if neither exists, do nothing)
		else if (excludeRows.outcomeVar && excludeRows.range) {
			// checks type of values of excludeRows
			if (typeof excludeRows.outcomeVar !== 'string' || !Array.isArray(excludeRows.range)) {
				throw new Error(`Argument excludeRows should be of form { outcomeVar : <string> , range : <array> } (given ${excludeRows})`);
			}
			// checks if excludeRows.range has length of 2
			if (excludeRows.range.length !== 2) {
				throw new Error(`Argument excludeRows.range should be of length 2 (given ${excludeRows.range})`);
			}
			// checks if the types of excludeRows.range is 'number'
			if (typeof excludeRows.range[0] !== 'number' || typeof excludeRows.range[1] !== 'number') {
				throw new Error(`Values of excludeRows.range should be of type 'number' (given ${excludeRows.range})`);
			}
			// compares values of excludeRows.range: first value should be smaller than the second
			if (excludeRows.range[0] >= excludeRows.range[1]) { // ?: perhaps > instead of >= ?
				throw new Error(`excludeRows.range[0] should be less than excludeRows.range[1] (given ${excludeRows.range})`);
			}
		}
		// checks if one exists but not the other
		else if (excludeRows.outcomeVar || excludeRows.range) {
			throw new Error(`Argument excludeRows should be of form { outcomeVar : <string> , range : <array> } (given ${excludeRows})`);
		}
		// else, excludeRows is effectively empty

		// -- sliderPosition --

		if (!Number.isInteger(sliderPosition)) {
			throw new Error(`sliderPosition is not an integer (given ${sliderPosition})`);
		}
		const numParameters = Object.keys(this.parameters).length;
		if (sliderPosition < 0 || numParameters < sliderPosition) {
			throw new Error(`sliderPosition should be in range [0, ${numParameters}] (given ${sliderPosition})`);
		}


		// --- SET INTERACTIONS ---

		// -- joinOptions --

		let newJoinOptions = [];

		// filter excludes option groups that are not valid
		// map produces the proper format
		if (Object.entries(joinOptions).length) {
			newJoinOptions = Object.entries(joinOptions).filter((arr, i) => {
				// if (! Array.isArray(arr)) { // ?: keep here or keep above?
				// 	throw new Error('Argument joinOptions should be of the form: array[array[string]]')
				// }
				let p = arr[0], o = arr[1];
				return (p in this.parameters) && // check if parameter exists
					o.map(x => this.parameters[p].includes(x)).reduce((a, b) => a && b) // check if options for that parameter exists
			}).flatMap( arr => {
				let option_pairs = arr[1].map((_, i, a) => a.slice(i, i+2)).filter(d => d.length == 2);
				return option_pairs.map(
					d => ({
							parameter: arr[0], 
							options: d, 
							indices: [this.parameters[arr[0]].indexOf(d[0]), this.parameters[arr[0]].indexOf(d[1])]
						})
				)
			})
		}
		
		// -- excludeOptions --
		// TODO: multiple options with the same name don't work

		excludeOptions = Array.from(new Set(excludeOptions)); // remove duplicates | ?: notify if removed?
		let newExcludeOptions = {};
		// Reminder: `in` gets the keys of an Object
		for (let key in this.parameters) newExcludeOptions[key] = [];
		for (let option of excludeOptions) { // ?: notify if nothing?
			if (option in this.invParameters) // makes sure is valid option
				newExcludeOptions[this.invParameters[option]].push(option);
		}
		
		// -- excludeRows --
		// TODO: make the visual also show up

		let newExcludeRows = [];
		// does nothing if excludeRows.outcomeVar is not present in the outcome visualizations
		// ?: should we notify if nothing has been selected?
		for (let i = 0; i < this.outcomes.length; i++) {
			if (this.outcomes[i].var === excludeRows.outcomeVar) {
				newExcludeRows = [i, excludeRows.range];
				break;
			}
		}

		// -- sliderPosition --

		// code based on the "on end" portion of dragSortDivider in utils/drag.js
		let boundaries = x_scale_params.range().map(d => (d - (groupPadding/2)));
		let slider = document.querySelector("g.grouped-sort-divider");
		slider.setAttribute("class", `grouped-sort-divider ${sliderPosition}`);
		slider.setAttribute("transform", `translate(${boundaries[sliderPosition]}, 0)`);
		sortByGroupParams = x_scale_params.domain().slice(sliderPosition).reverse();
		group_params.update(_ => sortByGroupParams);

		// by updating these, it should reactively call this.updateHandler elsewhere (App.svelte)
		join_options.update(_ => newJoinOptions);
		exclude_options.update(_ => newExcludeOptions);
		exclude_rows.update(_ => newExcludeRows);
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