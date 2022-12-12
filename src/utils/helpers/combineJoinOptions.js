function _combineJoinOptionsHelper(input) {
	let dict = {};                                              // (key:value) => (option:index in combined)
	let combined = [];                                          // holds the arrays of options to be joined (including disregarded ones)
	for (let [opt1, opt2] of input) {
		let ind1 = dict[opt1], ind2 = dict[opt2];               // the indices of where the join array is in combined
		if (opt1 in dict && opt2 in dict) {
			combined[dict[opt1]].push(...combined[dict[opt2]]); // combine the two arrays (puts all elements of opt2's array into opt1's)
			for (let opt of combined[dict[opt2]])               // change the index of the elements opt2's array to be the new combined array
				dict[opt] = dict[opt1];
		} else if (opt1 in dict) {                              // aka (opt1 in dict && !(opt2 in dict))
			combined[ind1].push(opt2);                          // put opt2 in the array that opt1 is in
			dict[opt2] = dict[opt1];                            // add opt2 to the dictionary, set index of opt2 to the index of opt1
		} else if (opt2 in dict) {                              // aka (opt2 in dict && !(opt1 in dict))
			combined[ind2].push(opt1);                          // put opt1 in the array that opt2 is in
			dict[opt1] = dict[opt2];                            // add opt1 to the dictionary, set index of opt1 to the index of opt2
		} else {
			combined.push([opt1, opt2]);                        // create a new array with opt1 and opt2
			dict[opt1] = combined.length-1;                     // set index of opt1 to the new array
			dict[opt2] = combined.length-1;                     // set index of opt2 to the new array
		}
	}
	let indices = [...new Set(Object.values(dict))];            // to get a unique array of indices
	let ret = [];                                               // holds the arrays of options to be joined (not including disregarded ones)
	for (let i of indices) {                                    // places the relevant arrays into ret
		ret.push(combined[i]);
	}
	return ret;
}

export default function combineJoinOptions(input_array) {
	let arr = structuredClone(input_array);
	let params = arr.map(d => d['parameter']).filter((v, i, a) => a.indexOf(v) === i);
	let new_arr = {};
	
	for (let i in params) {
		let input = arr.filter(d => (d['parameter'] == params[i]))
						.map(d => d['options']);
		let output = _combineJoinOptionsHelper(input) // recurseCombine(input);
		new_arr[params[i]] = output
	}

	return Object.entries(new_arr);
}