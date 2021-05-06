import { writable } from 'svelte/store';

export const state = writable(1);
export const selected = writable(0);
export const multi_param = writable(0);