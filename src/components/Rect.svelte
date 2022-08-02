<script>
	import { onMount } from 'svelte';
	import { Layer } from 'svelte-canvas';
	import { colors } from '../utils/colorPallete.js';
	import { tweened } from 'svelte/motion';
	import { linear } from 'svelte/easing';

	export let parameter, 
		option,
		x,
		y,
		width,
		height,
		translate,
		selected;

	let fill;

	const h = tweened(height, { duration: 500, easing: linear });
	const ypos = tweened(y, { duration: 500, easing: linear });

	$: h.set(height);
	$: ypos.set(y);

	$: render = ({ context }) => {
		if (selected.includes(option)) {
			fill = colors.active;
		} else {
			fill = colors.inactive;
		}

		context.fillStyle = fill;
		context.beginPath();
		context.rect(x + translate[0], $ypos + translate[1], width, $h);
		context.fill();
		context.closePath();
	};
</script>

<Layer {render} />
<!-- {#if universe[parameter].includes(option)}
	<rect 
		x="{(cell.width - cellWidth)/2}" 
		y="{y(j)}"
		width="{cellWidth}" 
		height="{y.bandwidth()}"
		transform="translate({x_scale_params(parameter) + x2(i)}, {gridNamesHeight})"
		class="{options_container} {parameter} {option} option-cell {selected_option}"
	/>
{:else}
	<rect 
		x="{(cell.width - cellWidth)/2}" 
		y="{y(j)}" 
		width="{cellWidth}" 
		height="{y.bandwidth()}"
		transform="translate({x_scale_params(parameter) + x2(i)}, {gridNamesHeight})"
		class="{options_container} {parameter} {option} option-cell"
	/>
{/if} -->