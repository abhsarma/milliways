<script>
	import { windowHeight, iconSize, groupPadding, gridNamesHeight } from '../utils/dimensions.js'
	import { parameter_scale } from '../utils/stores.js';

	export let parameters
	export let h

	$: ch = h > (windowHeight - gridNamesHeight) ? windowHeight - gridNamesHeight : h

	const dividerWidth = 3

	$: boundaries = $parameter_scale.range().map( d => (d - (groupPadding/2)) );
</script>

<g class="grouped-sort-divider {boundaries.length - 1}" 
	transform="translate({boundaries[boundaries.length - 1]}, 0)"
	style="cursor: pointer">
	<line x1=0 y1=0 x2=0 y2={ch} style="stroke: #666; stroke-width: {dividerWidth}"></line>
	<g class="grouped-sort-divider-icon" 
		transform="translate(0, {(ch - (iconSize * 4/3))/2})">
		<path d="M16,32L16,32c-5.3,0-9.6-4.3-9.6-9.6V9.6C6.4,4.3,10.7,0,16,0h0c5.3,0,9.6,4.3,9.6,9.6v12.8C25.6,27.7,21.3,32,16,32z"
			transform="translate({-iconSize*4/6}, 0)" fill="#666"></path>
		<path d="M20.92,11.67H10.91c-0.55,0-1-0.45-1-1v-0.01c0-0.55,0.45-1,1-1h10.01c0.55,0,1,0.45,1,1v0.01C21.91,11.22,21.47,11.67,20.92,11.67z"
			transform="translate({-iconSize*4/6}, 0)" fill="#fff"></path>
		<path d="M21,17H11c-0.55,0-1-0.45-1-1V16c0-0.55,0.45-1,1-1H21c0.55,0,1,0.45,1,1V16C22,16.55,21.55,17,21,17z"
			transform="translate({-iconSize*4/6}, 0)" fill="#fff"></path>
		<path d="M21.09,22.33H11.08c-0.55,0-1-0.45-1-1v-0.01c0-0.55,0.45-1,1-1h10.01c0.55,0,1,0.45,1,1v0.01C22.09,21.89,21.64,22.33,21.09,22.33z"
			transform="translate({-iconSize*4/6}, 0)" fill="#fff"></path>		
	</g>
</g>