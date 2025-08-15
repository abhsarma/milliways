<script>
	import Welcome from "./components/Welcome.svelte";
	import Interface from "./components/Interface.svelte";

	let init = true;
	let results, code, tableData, emar;

	function toggleDataSet(event) {
		results = event.detail.results;
		code = event.detail.code;
		tableData = event.detail.data;
		emar = event.detail.emar;
		
		init = false
	}
</script>

<main>
	{#if init}
   		<Welcome on:loadAnalysis={toggleDataSet}/>
	{:else}
		<Interface data={results} code={code} tableData={tableData} emar={emar}/>
	{/if}
</main>