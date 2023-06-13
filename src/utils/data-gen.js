import multiverseMatrix from './multiverseMatrix.js';
import cdf from '@stdlib/stats-base-dists-normal-cdf';
import { normal } from 'jstat'

import { exclude_options, exclude_rows, join_options, option_scale } from './utils/stores.js'

const CHARS = "qwertyuiopasdfghjklzxcvbnm";

function randString(len) {
	let str = "";
	for (let i = 0; i < len; i++) {
		str = str.concat(CHARS[Math.floor(Math.random() * CHARS.length)]);
	}
	return str;
}

function rnorm(n, mu = 0, sigma = 1) {
	return Array.from(Array(n)).map(d => normal.sample( mu, sigma ))
}


// found on stack overflow. gets all cartesian products (combinations) of any number of arrs
const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

export function generateData(numParameters, numOptions, numOutcomeVars) {
	/*
	Returns
	-------
	data
		[
			{
				".universe": <number> (index),

				param_0: option_i0_j0,

				param_1: option_i1_j1,
				...,

				"results":
				[
					{
						// other keys typically found in the data are not
						// generated as they are not used in multiverseMatrix
						"term"    : <variable>,
						"estimate": <number>,
						"min"     : <number>,
						"max"     : <number>,
						"cdf.x"   : Array<number>,
						"cdf.y"   : Array<number>
					},
					...
				]
			},
			...
		]
	options
		{
			param_0 : [ option_0_0, option_0_1, ... ],
			param_1 : [ option_1_0, option_1_1, ... ],
			...
		}
	parameters
		[ param_0, param_1, ... ]
	combos
		Cartesian product of the values of `options`
		[
			[ option_0_0, option_1_0, ... ],
			...
			[ option_0_i, option_1_j, ...],
			...
		]
	allOutcomeVars
		[ variable_0, variable_1, ...]
	*/

	if (numParameters === undefined) {
		numParameters = Math.floor(Math.random() * 4) + 2;
	}

	if (numOptions === undefined) {
		numOptions = Array.from(Array(numParameters)).map(d => Math.floor(Math.random() * 3) + 2);
	}

	if (numOutcomeVars == undefined) {
		numOutcomeVars = Math.floor(Math.random() * 3) + 1;
	}

	let parameters = Array.from(Array(numParameters)).map(d => randString(5));
	let options = Object.assign({}, ...numOptions.map((d, i) => ({[parameters[i]]: Array.from(Array(d)).map((x, j) => randString(5))})));
	let allOutcomeVars = Array.from(Array(numOutcomeVars)).map(d => randString(5));

	let combos;
	if (numParameters === 1)
		combos = options[parameters[0]].map(option => [option]);
	else
		combos = cartesian(...Object.values(options));

	let mean = 0, sd = 1;
	let estimates = Array.from(Array(numOutcomeVars)).map(d => rnorm(combos.length, mean, sd));
	let cdfx = Array.from(Array(161)).map((d, i) => -4 + i*0.05);

	// console.log(combos, parameters, options, allOutcomeVars, estimates);

	let data = [];
	for (let i = 0; i < combos.length; i++) {
		let universe = {
			'.universe': i+1,
			'results': []
		};
		for (let j = 0; j < parameters.length; j++) {
			let parameter = parameters[j];
			let option = combos[i][j];
			universe[parameter] = option;
		}

		for (let k = 0; k < allOutcomeVars.length; k++) {
			// let minx = Math.random()-1, maxx = Math.random()+3;
			// let dif = maxx-minx;
			// let mycdf = cdf.factory(dif/2 + minx, 0.3);

			// let cdfx = [], cdfy = [];
			// for (let j = 0; j < 101; j++) {
			// 	let x = dif*j/100 + minx;
			// 	cdfx.push(x);
			// 	cdfy.push(Number(mycdf(x).toFixed(4)));
			// }
			universe.results.push({
				"term": allOutcomeVars[k],
				"estimate": estimates[k][i],
				"cdf.x": cdfx,
				"cdf.y": cdfx.map((d) => normal.cdf(d, mean, sd))
				// "std.error": 2,
				// "statistic": 3,
				// "p.value": 4,
				// "conf.low": 5,
				// "conf.high": 6,
				// "min": minx,
				// "max": maxx,
				// "cdf.x": cdfx,
				// "cdf.y": cdfy
			});
		}
		data.push(universe);
	}
	return [data, options, parameters, combos, allOutcomeVars];
}