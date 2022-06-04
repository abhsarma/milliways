import { mean } from './arrayMethods.js'

/**
 * 
 * @param {array} gridData Multiverse grid data
 * @param {array} outcomeData Multiverse outcome data
 * @param {array} estimateData Multiverse estimate data
 * @param {boolean} ascending Boolean for ascending or descending
 * @param {boolean} outcomeIndex Index of the outcome we are sorting on
 * 
 * 
 * @return {object} Object containg sorted gridData, outcomeData, and estimateData 
 */
 function sortByOutcome(gridData, outcomeData, estimateData, ascending = false, outcomeIndex = 0) {
	// Sorting Factor --> The estimate value of the outcome that we are sorting on

	//  CHECK AS THE Outcome Data IS INITIALLY AN EMPTY ARRAY
	if (!outcomeData.length){
		return {gridData, outcomeData, estimateData}
	}

	// Add the sorting factor (the outcome that we are sorting on) to the gridData
	let gridDataSortingList = []
	// console.log(estimateData)
	for (let i =0; i< outcomeData[outcomeIndex].length; i++){
		// gridDataSortingList.push({'gridData': gridData[i], 'sortingFactor': estimateData[i]})
		let e;
		if (estimateData[i].length === undefined) e = estimateData[i]
			else e = mean(...estimateData[i])
		gridDataSortingList.push({'gridData': gridData[i], 'sortingFactor': e})
	}

	// Add the sorting factor (the outcome that we are sorting on) to each outcome 
	let outcomeDataSortingList = []
	for (let i =0; i< outcomeData.length; i++){
		var list = []
		for (let j=0; j< outcomeData[outcomeIndex].length; j++) {
			// list.push({'outcomeData': outcomeData[i][j], 'estimateData':estimateData[j], 'sortingFactor': estimateData[j]})
			let e;
				if (estimateData[j].length === undefined) e = estimateData[j]
					else e = mean(...estimateData[j])
			list.push({'outcomeData': outcomeData[i][j], 'estimateData':estimateData[j], 'sortingFactor': e})
		}
		outcomeDataSortingList.push(list)
	}

	// sort each of the outcomes according to the sorting factor
	for (let i=0; i<outcomeDataSortingList.length; i++){
		if (ascending) {
			outcomeDataSortingList[i].sort(function(a, b) {
				return ((a.sortingFactor < b.sortingFactor) ? -1 : ((a.sortingFactor == b.sortingFactor) ? 0 : 1));
			})
		}
		else {
			outcomeDataSortingList[i].sort(function(a, b) {
				return ((a.sortingFactor > b.sortingFactor) ? -1 : ((a.sortingFactor == b.sortingFactor) ? 0 : 1));
			})
		}
		
	}

	// Sort the grid data according to its sorting factor
	if (ascending) {
		gridDataSortingList.sort(function(a, b) {
			return ((a.sortingFactor < b.sortingFactor) ? -1 : ((a.sortingFactor == b.sortingFactor) ? 0 : 1));
		});
	}
	else {
		gridDataSortingList.sort(function(a, b) {
			return ((a.sortingFactor > b.sortingFactor) ? -1 : ((a.sortingFactor == b.sortingFactor) ? 0 : 1));
		});
	}

	// Reassign g_data to contain sorted values
	let g_data = gridDataSortingList.map(k => k.gridData);

	// Reassign o_data to contain sorted values
	let o_data = outcomeDataSortingList.map(k => k.map(j => j.outcomeData));

	// store e_data to contain sorting factors
	let e_data = outcomeDataSortingList.map(k => k.map(j => j.estimateData));


	return {g_data, o_data, e_data}
}

export default sortByOutcome;

