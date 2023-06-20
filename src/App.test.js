import { cleanup, render, fireEvent } from '@testing-library/svelte';
import App from './App.svelte';

jest.resetModules();

global.structuredClone = jest.fn(val => {
    return JSON.parse(JSON.stringify(val));
});

function channelMock() {}
channelMock.prototype.onmessage = function () {}
channelMock.prototype.postMessage = function (data) {
    this.onmessage({ data });
}
global.BroadcastChannel = channelMock;

import fs from 'fs';
import path from 'path';

let dirPath = path.resolve(__dirname, '../static/data');
let fileNames = fs.readdirSync(dirPath);
for (let fileName of fileNames) {
    if (fileName === '.DS_Store') continue;

    jest.mock(`${dirPath}\\${fileName}`, ()=>([]), { virtual: true });
}

beforeEach(() => {
    render(App);
});

describe('test', () => {

    it('test', () => {
    });
})