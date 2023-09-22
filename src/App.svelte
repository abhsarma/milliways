<script>
	import Welcome from "./components/Welcome.svelte";
	import Interface from "./components/Interface.svelte";

	// datasets (for the milliways-r pkg)
	import * as results from '../static/data/results.json'; 
    import * as code from '../static/data/code.json';
    import * as tableData from '../static/data/tabledata.json';

	let emar = 'analysis-doc.html';

	console.log("welcome should be hidden")
</script>

<main>
	<!-- {#if init}
   		<Welcome on:loadAnalysis={toggleDataSet}/>
	{:else} -->
	<Interface data={results.default} code={code} tableData={tableData.default} emar={emar}/>
	<!-- {/if} -->
</main>