import { writable } from 'svelte/store';

export const state = writable(1);
export const selected = writable(0);
export const multi_param = writable(0);
export const exclude_options = writable([]);
export const join_options = writable([]);
export const groupParams = writable([]);
export const option_order_scale = writable({});