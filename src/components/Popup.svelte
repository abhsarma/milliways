<script>
	import { header, nameContainer, gridNamesHeight, scrollbarWidth, outcomeVisWidth, namingDim } from '../utils/dimensions.js'
	import { colors } from '../utils/colorPallete.js';
	import { mean } from '../utils/helpers/arrayMethods.js'
	import { gridCollapse } from '../utils/stores.js'
</script>

<div style="position:absolute;top:0;left:0;height:100vh;width:100vw;background-color:${colors.gray+"80"};z-index:3;">
	<div id="info-popup"
		style="
			position:absolute;
			top:${header.top + nameContainer.height + gridNamesHeight}px;
			left:${document.querySelector('.button-wrapper').offsetWidth+document.querySelector('.main').offsetWidth}px;
			width:175px;
			white-space:initial;
			background-color:${colors.gray};
			color:#F6F6F6;
			border-radius:0 10px 10px 10px;">
		<p style="margin:10px;">
			Click on any rectangle to open a new window of the analysis document with the options of the selected row displayed.
		</p>
		<button
			style="margin:10px"
			>
			<!-- onclick="(function(e){e.parentElement.parentElement.remove();document.querySelector('body').style.overflow='auto';}) (this)" -->
			Close
		</button>
	</div>
</div>