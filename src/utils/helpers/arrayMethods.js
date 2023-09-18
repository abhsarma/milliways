export const arrayEqual = (x, y) => x.map((d, i) => (d === y[i])).reduce((a, b) => (a && b));

export const whichDiff = (x, y) => {
	return x.map((d, i) => (d === y[i]))
			.map((d, i) => { 
				if (!d) { return i } else { return false } 
			})
			.filter( i => !(i === false)) }

export const mean = (...x) => x.reduce((a, b) => a + b) / x.length;

export const any = (...x) => {
		if (x.every((x)=> typeof x === 'boolean')) {
			return x.some((x)=> (x == true))
		} else x //throw "expected array of booleans"
	}

export const is2dArray = (array) =>  array.every(item => Array.isArray(item));

export const indexOfAll = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);