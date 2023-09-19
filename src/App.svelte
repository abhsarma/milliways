<script>
	import Welcome from "./components/Welcome.svelte";
	import Interface from "./components/Interface.svelte";

	// datasets
	import * as data_hr from '../static/data/hurricane-data.json'; 
    import * as code_hr from '../static/data/hurricane-code.json';
    import * as tableData_hr from '../static/data/hurricane-raw-data.json';

	import * as data_sm from '../static/data/sm-data.json'; 
    import * as code_sm from '../static/data/sm-code.json';
    import * as tableData_sm from '../static/data/sm-raw-data.json';

    import * as data_durante from '../static/data/durante-data.json'; 
    import * as code_durante from '../static/data/durante-code.json';
	import * as tableData_durante from '../static/data/durante.json';

	let data, code, tableData, emar;
	function toggleDataSet(event) {
		if (event.detail.mode === 'hurricane') {
			data = data_hr;
			code = code_hr;
			tableData = tableData_hr;
			emar = "analysis-hurricane.html"
		} else if (event.detail.mode === 'social_media') {
			data = data_sm;
			code = code_sm;
			tableData = tableData_sm;
			emar = "analysis-hurricane.html"
		} else if (event.detail.mode === 'durante') {
			data = data_durante;
			code = code_durante;
			tableData = tableData_durante;
			emar = "analysis-hurricane.html"
		}

		console.log(data, code, tableData, emar)
		init = false;
	}

	let init = true;
</script>

<main>
	{#if init}
   		<Welcome on:loadAnalysis={toggleDataSet}/>
	{:else}
		<Interface data={data} code={code} tableData={tableData} emar={emar}/>
	{/if}
</main>