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
	for (let i =0; i< outcomeData[outcomeIndex].length; i++){
		gridDataSortingList.push({'gridData': gridData[i], 'sortingFactor': estimateData[outcomeIndex][i]})
	}

	// Add the sorting factor (the outcome that we are sorting on) to each outcome 
	let outcomeDataSortingList = []
	for (let i =0; i< outcomeData.length; i++){
		var list = []
		for (let j=0; j< outcomeData[outcomeIndex].length; j++) {
			list.push({'outcomeData': outcomeData[i][j], 'estimateData':estimateData[i][j], 'sortingFactor': estimateData[outcomeIndex][j]})
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
	

	// Reassign gridData to contain sorted values
	for (var k = 0; k < gridDataSortingList.length; k++) {
		gridData[k] = gridDataSortingList[k].gridData;
	}

	// Reassign outcomeData and estimateData to contain sorted values
	for (var k = 0; k < outcomeDataSortingList.length; k++) {
		for (var j = 0; j<outcomeDataSortingList[k].length; j++) {
			outcomeData[k][j] = outcomeDataSortingList[k][j].outcomeData
			estimateData[k][j] = outcomeDataSortingList[k][j].estimateData
		}
	}

	return {gridData, outcomeData, estimateData}
}

export default sortByOutcome;