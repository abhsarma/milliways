#!/bin/bash

function multiverse-vis() {
	data=$1
	if [ -z "$data" ]; then
		echo "ERROR: Must provide path to data.json file" 1>&2
	fi

	code=$2
	if [ -z "$code" ]; then
		echo "ERROR: Must provide path to code.json file" 1>&2
	fi

	analysis_doc=$3
	if [ -z "$analysis_doc" ]; then
		echo "ERROR: Must provide path to your interactive compiled HTML file" 1>&2
	fi

	if [ ! -z "$data" ] && [ ! -z "$code" ] && [ ! -z "$analysis_doc" ]; then
		echo "Loading data from $data"
		cp $data ./node_modules/svelte-app/static/data.json

		echo "Loading code from $code"
		cp $code ./node_modules/svelte-app/static/code.json

		echo "Extracting analysis from $analysis_doc"
		cp $analysis_doc ./node_modules/svelte-app/public/analysis_doc

		echo "Starting server at localhost:3000"
		npm --prefix ./node_modules/svelte-app/ run compile
	fi
}