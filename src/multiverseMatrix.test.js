import multiverseMatrix from './multiverseMatrix.js';
import { generateData } from './utils/data-gen.js';

import { exclude_options, exclude_rows, join_options, option_scale, parameter_scale } from './utils/stores.js'

//
// Mocks
//

// structuredClone does not work under the jsdom environment.
global.structuredClone = jest.fn(val => {
    return JSON.parse(JSON.stringify(val));
});

// Same with BroadcastChannel.
class channelMock {}
channelMock.prototype.onmessage = function () {}
channelMock.prototype.postMessage = function (data) {
    this.onmessage({ data });
}
global.BroadcastChannel = channelMock;

// parameter_scale is set in App.svelte. Here, its behavior is being imitated. 
parameter_scale.set({
    range(){
        return [0,1];
    },
    domain() {
        return [0,1];
    }
});

// jsdom does not provide querySelector.
let mockElement = {
    setAttribute(x, y) {
        return;
    }
};
document.querySelector = function() {
    return mockElement;
};

//
// Svelte store variables
//

let excludeOptions, excludeRows, joinOptions, optionScale, parameterScale;
const unsubs = [
    exclude_options.subscribe(val => excludeOptions=val),
    exclude_rows.subscribe(val => excludeRows=val),
    join_options.subscribe(val => joinOptions=val),
    option_scale.subscribe(val => optionScale=val),
    parameter_scale.subscribe(val => parameterScale=val)
];

//
// Testing setup and teardown
//

// Defined out here for ease of access in tests.
let m, data, options, parameters, combos, allOutcomeVars;

beforeAll(() => {
    // undefined means default behavior
    let numParameters  = undefined;
    let numOptions     = undefined;
    let numOutcomeVars = Math.floor(Math.random() * 2) + 3;

    // Variables initialized here to ensure they actually run before testing.
    [data, options, parameters, combos, allOutcomeVars] = generateData(numParameters, numOptions, numOutcomeVars);
});

afterAll(() => {
    // Avoids memory leaks.
    for (let i = 0; i < unsubs.length; i++) unsubs[i]();
})

beforeEach(() => {
    // Resets `m` before each test.
    m = new multiverseMatrix(data);
    m.initializeData();

    // Resets store variables
    exclude_options.set([]);
    exclude_rows.set([]);
    join_options.set([]);
    option_scale.set({});
})

//
//  Test cases
//

describe('when initialized', () => {
    describe('gridData', () => {
        it('is not empty (also checks gridDataAll)', () => {
            expect(m.gridData.length).not.toBe(0);
            expect(m.gridDataAll.length).not.toBe(0);
        });
        it('equals gridDataAll', () => {
            expect(m.gridData).toEqual(m.gridDataAll);
        });
        it('has the right types/format', () => {
            // NOTE: this only checks qualities about `m.gridData[0]`, i.e. it assumes its behavior
            // will carry over to all other such `m.gridData[i]`.
            expect(Array.isArray(m.gridData)).toBe(true);
            expect(typeof m.gridData[0]).toBe('object');
            let key = Object.keys(m.gridData[0])[0]; // gets a sample key
            expect(typeof m.gridData[0][key]).toBe('object');
            expect(typeof m.gridData[0][key][0]).toBe('string');
        });
    });

    describe('outcomes', () => {
        it('has a length of 1', () => {
            expect(m.outcomes.length).toBe(1);
        });
        it('has the right keys in its outcome', () => {
            let keys = Object.keys(m.outcomes[0]).sort();
            expect(['density', 'estimate', 'id', 'mode', 'var']).toEqual(keys);
        });
        it('has values with the right types in its outcome', () => {
            let o = m.outcomes[0];
            expect(Array.isArray(o.density)).toBe(true);
            expect(Array.isArray(o.estimate)).toBe(true);
            expect(typeof o.id).toBe('number');
            expect(typeof o.mode).toBe('number');
            expect(typeof o.var).toBe('string');
        });
        it('has values with certain qualities in its outcome', () => {
            let o = m.outcomes[0];
            expect(allOutcomeVars.includes(o.var)).toBe(true);
            expect(o.density.length).toBe(o.estimate.length);
            expect(o.density.length).toBe(m.size);
            expect(o.estimate).toEqual(m.estimates[0]);
        })
    });
});

test('initializeOutcomeData creates a new outcome', () => {
    m.initializeOutcomeData();
    expect(m.outcomes.length).toBe(2);

    // given an above test (specifically, when initialized > outcomes) works properly, this
    // should as well, so it will not be repeated here.
});

describe('updateGridData', () => {
    it('does nothing with no input', () => {
        m.updateGridData();
        expect(m.gridData).toEqual(m.gridDataAll);
    });

    it('excludes an option from a parameter', () => {
        let exclude = {};
        let param = parameters[0];
        let option = options[param][0];
        exclude[param] = [option];
        m.updateGridData([], exclude);

        // Make sure updateGridData alters `m.gridData`
        let paramOptions = new Set(m.gridData.map(obj => obj[param][0]));
        expect(paramOptions.has(option)).toBe(false);

        // Make sure updateGridData doesn't alter `m.gridDataAll`
        paramOptions = new Set(m.gridDataAll.map(obj => obj[param][0]));
        for (let option of options[param])
            expect(paramOptions.has(option)).toBe(true);
    });

    it('undos exclusion when called with no input', () => {
        // This section should be shown to work given the previous test.
        let exclude = {};
        let param = parameters[0];
        let option = options[param][0];
        exclude[param] = [option];
        m.updateGridData([], exclude);

        m.updateGridData(); // An empty call should reset `gridData`.
        expect(m.gridData).toEqual(m.gridDataAll);
    });
    
    it('joins two options from a parameter', () => {
        let param = parameters[0];
        let option1 = options[param][0];
        let option2 = options[param][1];
        let join = [{
            indices: [0,1],
            options: [option1, option2],
            parameter: param
        }];
        m.updateGridData(join);
        
        for (let obj of m.gridData) {
            if (obj[param].length === 2) {
                expect(obj[param]).toEqual([option1, option2]);
            } else {
                // Since other params were not joined, they should follow these expectations
                expect(obj[param].length).toBe(1);
                expect(obj[param][0]).not.toBe(option1);
                expect(obj[param][0]).not.toBe(option2);
            }
        }
    });

    it('undos joining when called with no input', () => {
        // This section should be shown to work given the previous test.
        let param = parameters[0];
        let option1 = options[param][0];
        let option2 = options[param][1];
        let join = [{
            indices: [0,1],
            options: [option1, option2],
            parameter: param
        }];
        m.updateGridData(join);

        m.updateGridData(); // An empty call should reset `gridData`.
        expect(m.gridData).toEqual(m.gridDataAll);
    });

    it('joins and excludes options in the same parameter (all different options)', () => {
        let param = parameters[0]
        let join = [{
            indices: [0,1],
            options: [options[param][0], options[param][1]],
            parameter: parameters[0]
        }];
        let exclude = {};
        exclude[param] = [options[param][2]];
        m.updateGridData(join, exclude);
        
        // check exclude
        let paramOptions = new Set(m.gridData.map(obj => obj[param][0]));
        expect(paramOptions.has(options[param][2])).toBe(false);

        // check join
        for (let obj of m.gridData) {
            if (obj[param].length === 2) {
                expect(obj[param]).toEqual([options[param][0], options[param][1]]);
            } else {
                // Since other params were not joined, they should follow these expectations
                expect(obj[param].length).toBe(1);
                expect(obj[param][0]).not.toBe(options[param][0]);
                expect(obj[param][0]).not.toBe(options[param][1]);
            }
        }

    });

    it('joins and excludes options in the same parameter (excludes one of the joined options)', () => {
        // This has the same behavior as just join.

        let param = parameters[0];
        let join = [{
            indices: [0,1],
            options: [options[param][0], options[param][1]],
            parameter: parameters[0]
        }];
        let exclude = {};
        exclude[parameters[0]] = [options[param][1]];

        m.updateGridData(join);
        let joinGridData = structuredClone(m.gridData);

        m.updateGridData(join, exclude);

        expect(joinGridData).toEqual(m.gridData);
    });

    it('undos joining and exclusion when called with no input', () => {
        // This section should be shown to work given the previous test.
        let join = [{
            indices: [0,1],
            options: [options[parameters[0]][0], options[parameters[0]][1]],
            parameter: parameters[0]
        }];
        let exclude = {};
        exclude[parameters[0]] = [options[parameters[0]][2]];
        m.updateGridData(join, exclude);

        m.updateGridData(); // An empty call should reset `gridData`.
        expect(m.gridData).toEqual(m.gridDataAll);
    });

    // Errors

    it('errors with invalid types', () => {
        expect(() => m.updateGridData(1)).toThrow();
        expect(() => m.updateGridData('asdf')).toThrow();
        expect(() => m.updateGridData([1])).toThrow();
        expect(() => m.updateGridData([1,2])).toThrow();
        expect(() => m.updateGridData([{}])).toThrow();
        expect(() => m.updateGridData([{},{}])).toThrow();
        expect(() => m.updateGridData([{
            'indices' : 1,
            'options' : 1,
            'parameter' : 1
        }])).toThrow();

        expect(() => m.updateGridData([{
            indices: [0, 1],
            options: [options[parameters[0]][0], options[parameters[0]][1]],
            parameter: 0 // Not correct type!
        }])).toThrow();
    });

    it('errors with correct types, but invalid values', () => {
        // 'aaaa' is not a parameter!
        expect(() => m.updateGridData([{
            indices: [0, 1],
            options: [options[parameters[0]][0], options[parameters[0]][1]],
            parameter: 'aaaa'
        }])).toThrow();
    });

    // Edge cases

    it('does not error with certain improper types', () => {
        // TODO: change these tests to make sure that nothing is changed

        // expect(() => m.updateGridData([{
        //     indices: ['a','b'], // Not correct types!
        //     options: [options[parameters[0]][0], options[parameters[0]][1]],
        //     parameter: parameters[0]
        // }])).toThrow();

        // expect(() => m.updateGridData([{
        //     indices: [0, 1],
        //     options: [123, 321], // Not correct types!
        //     parameter: parameters[0]
        // }])).toThrow();
    });

    it('does not error with certain improper values', () => {
        // TODO: change these tests to make sure that nothing is changed

        // [0, 2] are not the correct indices (should be [0, 1])!
        // expect(() => m.updateGridData([{
        //     indices: [0, 2],
        //     options: [options[parameters[0]][0], options[parameters[0]][1]],
        //     parameter: parameters[0]
        // }])).toThrow();

        // 'indices' has too many values (should be 2)!
        // expect(() => m.updateGridData([{
        //     indices: [0, 1, 2],
        //     options: [options[parameters[0]][0], options[parameters[0]][1]],
        //     parameter: parameters[0]
        // }])).toThrow();

        // 'aaaa' and 'bbbb' are not options!
        // expect(() => m.updateGridData([{
        //     indices: [0, 1],
        //     options: ['aaaa', 'bbbb'],
        //     parameter: parameters[0]
        // }])).toThrow();

        // 'options' has too many values (should be 2)!
        // expect(() => m.updateGridData([{
        //     indices: [0, 1],
        //     options: [options[parameters[0]][0], options[parameters[0]][1], options[parameters[0]][2]],
        //     parameter: parameters[0]
        // }])).toThrow();
    });
});

describe('updateOutcomeData', () => {
    /*
        As a reminder, `m.outcomes` looks like this:
        [
            {
                var: <variable>,
                density: [
                    [ [ <num>, <num>, <num> ], ...],
                    ...
                ], // without joins/excludes, the shape of density is (m.size, 101, 3)
                id: <int>,
                estimate: [<num>, ...],
                mode: <num>
            },
            ...
        ]
    */
    it('changes outcome data properly after changing outcome variable', () => {
        let prevVis = structuredClone(m.outcomes[0]);

        // The code is written in such a way that does this outside of the update function
        // Since this is manually changed, we won't check characteristics of this variable below
        m.outcomes[0].var = allOutcomeVars[1];

        m.updateOutcomeData(0, m.outcomes[0].var, [], []);
        
        //
        // checks that `m.outcomes[0]` has changed
        //

        expect(prevVis.id).toBe(m.outcomes[0].id);

        // `.estimate` is sorted in `updateHandler`, so these should be equal at this point
        expect(m.outcomes[0].estimate).toEqual(m.estimates[0]);

        let estimate = [];
        for (let d of data) {
            for (let r of d.results) {
                if (r.term === m.outcomes[0].var) {
                    estimate.push(r.estimate);
                    break;
                }
            }
        }
        expect(m.outcomes[0].estimate).toEqual(estimate);

        expect(prevVis.mode).toBe(m.outcomes[0].mode);
        
        //
        // type check
        //

        expect(Array.isArray(m.outcomes[0].density)).toBe(true);
        expect(Array.isArray(m.outcomes[0].density[0])).toBe(true);
        expect(Array.isArray(m.outcomes[0].density[0][0])).toBe(true);
        expect(m.outcomes[0].density[0][0].every(v => typeof v === 'number')).toBe(true);
        expect(m.outcomes[0].estimate.every(v => typeof v === 'number')).toBe(true);
        
    });

    it('changes the estimates of 2 outcomes properly with a change in outcomes variable', () => {
        // Note: Only estimates are checked here

        // creates second outcome
        m.initializeOutcomeData();

        // In practice, only one variable is changed at a time, so that will be emulated here.

        // First change

        m.outcomes[0].var = allOutcomeVars[1];
        m.updateOutcomeData(0, m.outcomes[0].var, [], []);

        let estimate0 = [];
        let estimate1 = [];
        for (let d of data) {
            for (let r of d.results) {
                if (r.term === m.outcomes[0].var)
                    estimate0.push(r.estimate);
                if (r.term === m.outcomes[1].var)
                    estimate1.push(r.estimate);
            }
        }

        expect(m.outcomes[0].estimate).toEqual(estimate0);
        expect(m.outcomes[1].estimate).toEqual(estimate1);

        // Second change

        m.outcomes[1].var = allOutcomeVars[2];
        m.updateOutcomeData(1, m.outcomes[1].var, [], []);

        estimate1 = [];
        for (let d of data) {
            for (let r of d.results) {
                if (r.term === m.outcomes[1].var) {
                    estimate1.push(r.estimate);
                    break;
                }
            }
        }

        expect(m.outcomes[0].estimate).toEqual(estimate0);
        expect(m.outcomes[1].estimate).toEqual(estimate1);
    });
});

describe('updateHandler', () => {
    it('handles ascending sorting properly', () => {
        // setup
        m.sortByIndex = 0;
        m.sortAscending = true;

        let prevGridData = structuredClone(m.gridData);

        // manually sorts estimates
        let sortedEstimate = m.outcomes[0].estimate.map((v, i) => [v, i]);
        sortedEstimate.sort((a,b) => a[0]-b[0]);
        
        // No input should be fine; implies no join, no exclude.
        m.updateHandler();
        
        expect(m.outcomes[0].estimate).toEqual(sortedEstimate.map(v => v[0]));
        expect(m.gridData).toEqual(sortedEstimate.map(v => prevGridData[v[1]]));
    });
    
    it('handles descending sorting properly', () => {
        // setup
        m.sortByIndex = 0;
        m.sortAscending = false;

        let prevGridData = structuredClone(m.gridData);

        // manually sorts estimates
        let sortedEstimate = m.outcomes[0].estimate.map((v, i) => [v, i]);
        sortedEstimate.sort((a,b) => b[0]-a[0]);
        
        // No input should be fine; implies no join, no exclude.
        m.updateHandler();
        
        expect(m.outcomes[0].estimate).toEqual(sortedEstimate.map(v => v[0]));
        expect(m.gridData).toEqual(sortedEstimate.map(v => prevGridData[v[1]]));
    });

    it('handles no sort properly', () => {
        // setup
        m.sortByIndex = -1;
        // m.sortAscending shouldn't matter

        // manually creates estimate/gridData data
        let gridData = [];
        let estimate = [];
        for (let d of data) {
            let gridDatum = structuredClone(d);
            delete gridDatum['.universe'];
            delete gridDatum['results'];

            // turns `param: option` to  `param: [option]` like in `m.gridData`
            Object.keys(gridDatum).forEach(key => gridDatum[key] = [gridDatum[key]]);

            gridData.push(gridDatum);

            for (let r of d.results) {
                if (r.term === m.outcomes[0].var) {
                    estimate.push(r.estimate);
                    break;
                }
            }
        }

        // No input should be fine; implies no join, no exclude.
        m.updateHandler();

        // `m.estimates` is not sorted, so these should be equal
        expect(m.outcomes[0].estimate).toEqual(m.estimates[0]);

        expect(m.outcomes[0].estimate).toEqual(estimate);
        expect(m.gridData).toEqual(gridData);
    });

    it('excludes rows as specified', () => {
        // Reminder:
        // idx refers to which Vis, [low, high] is the range of values to keep
        // [low, high] is inclusive of both low and high
        let idx = 0;
        let low = 0, high = 1;
        let toExclude = [idx, [low, high]];

        // manually exclude rows
        let mask = m.outcomes[idx].estimate.map(v => low<=v && v<=high);
        let estimate = m.outcomes[idx].estimate.filter((_,i) => mask[i]);
        let density = m.outcomes[idx].density.filter((_,i) => mask[i]);
        let gridData = m.gridData.filter((_,i) => mask[i]);

        // sort to match (as default behavior is ascending sort)
        let sortIdxs = estimate.map((v,i) => [v,i]);
        sortIdxs.sort((a,b) => a[0] - b[0]);
        sortIdxs = sortIdxs.map(v => v[1]);
        estimate = estimate.map((_,i) => estimate[sortIdxs[i]]);
        density = density.map((_,i) => density[sortIdxs[i]]);
        gridData = gridData.map((_,i) => gridData[sortIdxs[i]]);

        m.updateHandler([], [], toExclude);

        expect(m.outcomes[0].estimate).toEqual(estimate);
        expect(m.outcomes[0].density).toEqual(density);
        expect(m.gridData).toEqual(gridData);
    });
});

describe('setInteractions', () => {
    describe('is able to alter store variables', () => {
        it('exclude_options', () => {
            // example parameter and option
            let param = parameters[0];
            let option = options[param][0];

            // This is what is passed into setInteractions
            let toExclude = [option];

            // This is what the store variable should be after setInteractions
            let excludeStore = {};
            for (let parameter of parameters)
                excludeStore[parameter] = [];
            excludeStore[param] = [option];

            // change store variable
            m.setInteractions({}, toExclude);
            expect(excludeOptions).toEqual(excludeStore);

            // change back store variable to empty
            m.setInteractions();
            for (let parameter of parameters)
                expect(excludeOptions[parameter]).toEqual([]);
        });

        it('join_options', () => {
            // example parameter and options
            let param = parameters[0];
            let option1 = options[param][0];
            let option2 = options[param][1];

            // This is what is passed into setInteractions
            let toJoin = {};
            toJoin[param] = [option1, option2];

            // This is what the store variable should be after setInteractions
            let joinStore = [{
                indices: [0,1],
                options: [option1, option2],
                parameter: param
            }];

            // change store variable
            m.setInteractions(toJoin);
            expect(joinOptions).toEqual(joinStore);

            m.setInteractions();
            expect(joinOptions).toEqual([]);
        });

        // it('exclude_rows', () => {
        //     m.setInteractions([],[], excludeRows={ outcomeVar:allOutcomeVars[0], range:[0,1] });
        //     expect(excludeRows).toEqual([0, [0,1]]);

        //     m.setInteractions();
        //     expect(excludeRows).toEqual([]);
        // });
    });

    // TODO: Add error checking?
});