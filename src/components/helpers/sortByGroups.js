/**
 * 
 * @param {array} gridData Multiverse grid data
 * @param {array} outcomeData Multiverse outcome data
 * @param {array} estimateData Multiverse estimate data
 * @param {boolean} ascending Boolean for ascending or descending
 * @param {array} parameters the list of parameters
 * @param {boolean} outcomeIndex Index of the outcome we are sorting on
 * 
 * 
 * @return {object} Object containg sorted gridData, outcomeData, and estimateData 
 */
class HeirarchalSort {
    constructor(gridData, outcomeData, estimateData, ascending, parameters, outcomeIndex=0){
        this.root = {
            e_dat: estimateData,
            o_dat: outcomeData,
            g_dat: gridData
        }

        this.gridData = gridData
        this.outcomeData = outcomeData
        this.estimateData = estimateData
        this.ascending = ascending
        
        this.parameters = Object.entries(parameters).map(d => Object.assign({}, {parameter: d[0], options: d[1]}))

        this.currentPartitions = []
        this.outcomeIndex = outcomeIndex // the index of the outcome we are currently sorting on, dafualts to panel 1

        // // -- LOGS -- //
        // console.log("Parameters")
        // console.log(this.parameters)

        // console.log("Grid Data")
        // console.log(this.gridData)
        
        // console.log("Estimate Data")
        // console.log(this.estimateData)

        // console.log("Outcome Data")
        // console.log(this.outcomeData)
    }

    // this function constructs the tree
    PartitionOnParameters = (parameterPartitions, node = this.root, ) => {

        // if we have already executed all partitions, return
        if (parameterPartitions.length == 0) {
            return node;
        }

        // gather the data from the node
        const {g_dat, o_dat, e_dat} = node;

        console.log(parameterPartitions)
        console.log()
        
        // exectue the parititon on the node's children
        const partitionParameter = parameterPartitions.shift()
        node['partitionParameter'] = partitionParameter

        const partitionChildren = this.PartitionHelper(partitionParameter, g_dat, o_dat, e_dat)
        console.log('CHILDREN')
        console.log(partitionChildren)

        node.children = partitionChildren

        node.children = node.children.map((childNode) => {
            return this.PartitionOnParameters(parameterPartitions, childNode)
            // console.log(temp)
        })
 
        return node
    }

    // function takes in a parameter, and splits a group of grid data into n sub categories
    PartitionHelper = (partitionParameter, g_dat, o_dat, e_dat) => {
        // if the parameter is not  aparameter in this universe
       var parameterOptions;
       this.parameters.forEach(p => {
           if (p.parameter == partitionParameter) {
               parameterOptions = Object.values(p.options)
           }
       })

       // initialize the children of this parittion
       var children = []

       // loop through parameter options, for each one:
       parameterOptions.forEach((option) => {
           // initialize child node
            var childNode = {
                parameterOption: option,
                estimate: null,
            }

            // filter grid, outcome and estimate data
            var childGridData = []
            var childEstimateData = []
            e_dat.forEach(estimateVector => childEstimateData.push([]))
            var childOutcomeData = []
            o_dat.forEach(outcomeVector => childOutcomeData.push([]))

            for (let i=0; i<g_dat.length; i++){
                if (g_dat[i][partitionParameter]==option){ // if this universe is of the current option
                    childGridData.push(g_dat[i])
                    e_dat.map((estiamteArray,index) => {
                        childEstimateData[index].push(estiamteArray[i])
                    })
                    o_dat.map((estiamteArray,index) => {
                        childOutcomeData[index].push(estiamteArray[i])
                    })
                }
            }


            // -- LGOS -- //
            // console.log("child Grid Data")
            // console.log(childGridData)
            
            // console.log("child Estimate Data")
            // console.log(childEstimateData)


            // console.log("child Outcome Data")
            // console.log(childOutcomeData)

            
            // aggregate estiamte data 
            var total = 0;
            var count = 0;

            childEstimateData[this.outcomeIndex].forEach((estiamteValue, index) => {
                total += estiamteValue;
                count++;
            });

            childNode['estimate'] = total / count
            childNode['g_dat'] = childGridData
            childNode['e_dat'] = childEstimateData
            childNode['o_dat'] = childOutcomeData
            children.push(childNode)
       })

    //    console.log('----- CHILDREN ----')
    //    console.log(children)
       return children
    }

}

export default HeirarchalSort;