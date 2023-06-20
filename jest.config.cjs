module.exports = {
    "testEnvironment": "jsdom",
    "transform": {
        "^.+\\.js$": "babel-jest",
        "^.+\\.svelte$": ["svelte-jester",{"preprocess": true}]
    },
    "transformIgnorePatterns": [
        "node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)"
    ],
    "moduleFileExtensions": ["js","svelte","json"],
    "moduleNameMapper": {
        "^.+\\.(gif|png)$": "<rootDir>/mocks/fileMock.js"
    }
};