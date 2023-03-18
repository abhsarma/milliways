import multiverseMatrix from './multiverseMatrix.js';
import cdf from '@stdlib/stats-base-dists-normal-cdf';

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

    let combos = cartesian(...Object.values(choices));

    let variables = [];
    let numVariables = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numVariables; i++) variables.push(randString(5));

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

        for (let variable of variables) {
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
    return [data, choices, parameters, combos, variables];
}

describe('multiverseMatrix', () => {
    let m, data, choices, parameters, combos, variables;
    beforeEach(() => {
        [data, choices, parameters, combos, variables] = generateData();
        m = new multiverseMatrix(data);
        m.initializeData();
    });

    describe('initialization', () => {

    });

    describe('updateGridData', () => {
        it('does nothing with no input', () => {
            m.updateGridData();
            expect(m.gridData).toEqual(m.gridDataAll);
        });

        it('excludes an option from a parameter', () => {
            let exclude = {};
            exclude[parameters[0]] = [choices[parameters[0]][0]];
            m.updateGridData([], exclude);
            expect(m.gridData).not.toEqual(m.gridDataAll);
            expect(parameters[0] in m.gridData).toBe(false); // FIX (m.gridData is an array of Objects)
        });

        it('undos exclusion when called with no input', () => {
            m.updateGridData();
            expect(m.gridData).toEqual(m.gridDataAll);
        });

        it('joins two options from a parameter', () => {
            let join = [{
                indices: [0,1],
                options: [choices[parameters[0]][0], choices[parameters[0]][1]],
                parameter: parameters[0]
            }];
            m.updateGridData(join, {});
            expect() // TODO
        });

        it('undos joining when called with no input', () => {
            m.updateGridData();
            expect(m.gridData).toEqual(m.gridDataAll);
        });

        it('joins and excludes options in the same parameter', () => {
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
    });

    describe('updateOutcomeData', () => {
        it('should have 1 outcome (after calling initializeData)', () => {
            expect(m.outcomes.length).toBe(1);
        });
        it('')
    });
});