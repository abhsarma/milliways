import { writable } from 'svelte/store';

export const gridCollapse = writable(0);
export const selected = writable(0);
export const multi_param = writable(0);
export const exclude_options = writable([]);
export const join_options = writable([]);
export const groupParams = writable([]);
export const param_order_scale = writable({});
export const option_order_scale = writable({});