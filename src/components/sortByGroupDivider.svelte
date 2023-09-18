<script>
	import { windowHeight, iconSize, groupPadding, gridNamesHeight } from '../utils/dimensions.js'
	import { parameter_scale } from '../utils/stores.js';

	export let h
	export let y

	$: ch = h > (windowHeight - gridNamesHeight) ? windowHeight - gridNamesHeight : h

	const dividerWidth = 1.5

	$: boundaries = $parameter_scale.range().map( d => (d - (groupPadding/2 - 4)) );
</script>

<g class="grouped-sort-divider {boundaries.length - 1}" 
	transform="translate({boundaries[boundaries.length - 1]}, 0)"
	style="cursor: pointer">
	<g transform="translate(0, {y})"> <!-- to shift the y position of the divider on scroll  -->
		<line x1=0 y1=0 x2=0 y2={ch} style="stroke: #666; stroke-width: {dividerWidth}"></line>
		<g class="grouped-sort-divider-icon" 
			transform="translate(-16, {(ch - (iconSize * 4/3))/2})">
			<path class="st0" d="M16,32L16,32c-5,0-9-4-9-9V9c0-5,4-9,9-9h0c5,0,9,4,9,9v14C25,28,21,32,16,32z"/>
			<path class="st1" d="M9.6,16.3l4,5.5c0.3,0.4,0.9,0.2,0.9-0.3v-11c0-0.5-0.6-0.7-0.9-0.3l-4,5.5C9.5,15.9,9.5,16.1,9.6,16.3z"/>
			<path class="st1" d="M22.5,15.7l-4-5.4c-0.3-0.4-0.9-0.2-0.9,0.3v10.8c0,0.5,0.6,0.7,0.9,0.3l4-5.4C22.6,16.1,22.6,15.9,22.5,15.7z"/>
		</g>
	</g>
</g>

<style type="text/css">
	.st0{fill:#fafafa; stroke:#666666}
	.st1{fill:#666666;}
</style>