import { writable } from 'svelte/store';

export const gridCollapse = writable(0);
export const exclude_options = writable([]);
export const exclude_rows = writable([]);
export const join_options = writable([]);
export const group_params = writable([]);
export const parameter_scale = writable({});
export const option_scale = writable({});