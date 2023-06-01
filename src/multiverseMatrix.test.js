// TODO: check stores, vis events (sort, dropdown), slider

import multiverseMatrix from './multiverseMatrix.js';
import cdf from '@stdlib/stats-base-dists-normal-cdf';

import { exclude_options, exclude_rows, join_options, option_scale } from './utils/stores.js'

const CHARS = "`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?";
function randString(len) {
    let str = "";
    for (let i = 0; i < len; i++) {
        str = str.concat(CHARS[Math.floor(Math.random() * CHARS.length)]);
    }
    return str;
}
// found on stack overflow. gets all cartesian products (combinations) of any number of arrs
const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

function generateData() {
    /*
    Returns
    -------
    data
        [
            {
                ".universe": <number> (index),

                ".parameter-assignment":
                {
                    // in_jn is simply to show that these are arbitrary indexes
                    // i.e. in this case, i0 has no relation with j0, i1, or j1
                    param_0: [option_i0_j0],
                    param_1: [option_i1_j1],
                    ...
                },

                // same as inside ".parameter-assignment" but the values are
                // not enclosed within an array
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
    choices
        {
            param_0 : [ option_0_0, option_0_1, ... ],
            param_1 : [ option_1_0, option_1_1, ... ],
            ...
        }
    parameters
        [ param_0, param_1, ... ]
    combos
        Cartesian product of the values of `choices`
        [
            [ option_0_0, option_1_0, ... ],
            ...
            [ option_0_i, option_1_j, ...],
            ...
        ]
    allOutcomeVars
        [ variable_0, variable_1, ...]
    */
    let choices = {};
    let parameters = [];
    let numParameters = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numParameters; i++) {
        let paramName = randString(5);
        choices[paramName] = [];
        parameters.push(paramName);

        let numOptions = Math.floor(Math.random() * 3) + 3;
        for (let j = 0; j < numOptions; j++)
            choices[paramName].push(randString(5));
    }

    let combos;
    if (numParameters === 1)
        combos = choices[parameters[0]].map(option => [option]);
    else
        combos = cartesian(...Object.values(choices));

    let allOutcomeVars = [];
    let numVariables = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numVariables; i++) allOutcomeVars.push(randString(5));

    let data = [];
    for (let i = 0; i < combos.length; i++) {
        let universe = {
            '.universe': i+1,
            '.parameter_assignment': {},
            'results': []
        };
        for (let j = 0; j < parameters.length; j++) {
            let parameter = parameters[j];
            let choice = combos[i][j]
            universe[parameter] = choice;
            universe['.parameter_assignment'][parameter] = [choice]
        }

        for (let variable of allOutcomeVars) {
            let minx = Math.random()-1, maxx = Math.random()+3;
            let dif = maxx-minx;
            let mycdf = cdf.factory(dif/2 + minx, 0.3);

            let cdfx = [], cdfy = [];
            for (let j = 0; j < 101; j++) {
                let x = dif*j/100 + minx;
                cdfx.push(x);
                cdfy.push(Number(mycdf(x).toFixed(4)));
            }
            universe.results.push({
                "term": variable,
                "estimate": 1,
                // "std.error": 2,
                // "statistic": 3,
                // "p.value": 4,
                // "conf.low": 5,
                // "conf.high": 6,
                "min": minx,
                "max": maxx,
                "cdf.x": cdfx,
                "cdf.y": cdfy
            });
        }
        data.push(universe);
    }
    return [data, choices, parameters, combos, allOutcomeVars];
}

// Defined out here for ease of access in tests.
let m, data, choices, parameters, combos, allOutcomeVars;

beforeAll(() => {
    // Variables initialized here to ensure they actually run before testing.
    [data, choices, parameters, combos, allOutcomeVars] = generateData();
});

// Resets `m` before each test.
beforeEach(() => {
    m = new multiverseMatrix(data);
    m.initializeData();
})

// TODO: for all, handle invalid input (if error, check https://stackoverflow.com/questions/46042613/how-to-test-the-type-of-a-thrown-exception-in-jest)

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

describe('updateGridData', () => {
    it('does nothing with no input', () => {
        m.updateGridData();
        expect(m.gridData).toEqual(m.gridDataAll);
    });

    it('excludes an option from a parameter', () => {
        let exclude = {};
        let param = parameters[0];
        let option = choices[param][0];
        exclude[param] = [option];
        m.updateGridData([], exclude);
        expect(m.gridData).not.toEqual(m.gridDataAll);

        // Gets all values associated with the parameter `parameters[0]` in `this.gridData`.
        let param_options = new Set(m.gridData.map(obj => obj[param][0]));
        expect(option in param_options).toBe(false);
    });

    it('undos exclusion when called with no input', () => {
        // This section should be shown to work given the previous test.
        let exclude = {};
        let param = parameters[0];
        let option = choices[param][0];
        exclude[param] = [option];
        m.updateGridData([], exclude);

        m.updateGridData(); // An empty call should reset `gridData`.
        expect(m.gridData).toEqual(m.gridDataAll);
    });
    
    it('joins two options from a parameter', () => {
        let param = parameters[0];
        let option1 = choices[param][0];
        let option2 = choices[param][1];
        let join = [{
            indices: [0,1],
            options: [option1, option2],
            parameter: param
        }];
        m.updateGridData(join);
        
        for (let obj of m.gridData) {
            if (obj[param].length === 2) {
                expect(obj[param]).toStrictEqual([option1, option2]);
            } else {
                expect(obj[param].length).toBe(1);
                expect(obj[param][0]).not.toBe(option1);
                expect(obj[param][0]).not.toBe(option2);
            }
        }
    });

    it('undos joining when called with no input', () => {
        // This section should be shown to work given the previous test.
        let param = parameters[0];
        let option1 = choices[param][0];
        let option2 = choices[param][1];
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
        let join = [{
            indices: [0,1],
            options: [choices[parameters[0]][0], choices[parameters[0]][1]],
            parameter: parameters[0]
        }];
        let exclude = {};
        exclude[parameters[0]] = [choices[parameters[0]][2]];
        m.updateGridData(join, exclude);
        expect() // TODO
    });

    it('joins and excludes options in the same parameter (excludes one of the joined options)', () => {
        let join = [{
            indices: [0,1],
            options: [choices[parameters[0]][0], choices[parameters[0]][1]],
            parameter: parameters[0]
        }];
        let exclude = {};
        exclude[parameters[0]] = [choices[parameters[0]][1]];
        m.updateGridData(join, exclude);
        expect() // TODO
    });

    it('undos joining and exclusion when called with no input', () => {
        // This section should be shown to work given the previous test.
        let join = [{
            indices: [0,1],
            options: [choices[parameters[0]][0], choices[parameters[0]][1]],
            parameter: parameters[0]
        }];
        let exclude = {};
        exclude[parameters[0]] = [choices[parameters[0]][2]];
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
            options: [choices[parameters[0]][0], choices[parameters[0]][1]],
            parameter: 0 // Not correct type!
        }])).toThrow();
    });

    it('errors with correct types, but invalid values', () => {
        // 'aaaa' is not a parameter!
        expect(() => m.updateGridData([{
            indices: [0, 1],
            options: [choices[parameters[0]][0], choices[parameters[0]][1]],
            parameter: 'aaaa'
        }])).toThrow();
    });

    // Edge cases

    it('does not error with certain improper types', () => {
        // TODO: change these tests to make sure that nothing is changed

        // expect(() => m.updateGridData([{
        //     indices: ['a','b'], // Not correct types!
        //     options: [choices[parameters[0]][0], choices[parameters[0]][1]],
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
        //     options: [choices[parameters[0]][0], choices[parameters[0]][1]],
        //     parameter: parameters[0]
        // }])).toThrow();

        // 'indices' has too many values (should be 2)!
        // expect(() => m.updateGridData([{
        //     indices: [0, 1, 2],
        //     options: [choices[parameters[0]][0], choices[parameters[0]][1]],
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
        //     options: [choices[parameters[0]][0], choices[parameters[0]][1], choices[parameters[0]][2]],
        //     parameter: parameters[0]
        // }])).toThrow();
    });
});

describe('updateOutcomeData', () => {
    it('test', () => {

    });
});

describe('updateHandler', () => {

});

// describe('setInteractions', () => {
//     // look in function for explanation
    
//     let choice0 = choices[parameters[0]], choice1 = [parameters[1]]

//     m.setInteractions([ [choice0[0], choice0[1]], [choice1[0], choice1[1]] ]);
//     m.setInteractions([ [choice0[0], choice0[1]], [choice1[1], choice1[0]] ]);
    
//     m.setInteractions([ [choice0[0], choice0[2]] ]); // FAIL
    
//     m.setInteractions([ [choice0[0], choice0[1]], [choice0[1], choice0[2]] ]);

//     m.setInteractions([ [choice0[0], choice0[1]], [choice0[0], choice0[2]] ]);
    
//     m.setInteractions([], ['p_1','p_3','q_1']);
    
//     m.setInteractions(
//         [
//             [choice0[0], choice0[1]],
//             [choice0[1], choice0[2]]
//         ], 
//         [choice0[2]]
//     );

//     // TODO: alter accordingly
//     m.setInteractions([], [], { outcomeVar: "o_1", range: [4.123, 4.987] })

//     m.setInteractions(excludeRows={ outcomeVar: "o_1", range: ["4.123", "4.987"] })

//     m.setInteractions(excludeRows={ outcomeVar: "o_1", range: [0] })

//     m.setInteractions(excludeRows={ outcomeVar: "o_2", range: [0,0.5] })
    
//     m.setInteractions(excludeRows={ outcomeVar: "o_3", range: [1,2] })
// })