<script>
	import logo from "../assets/images/logo.jpg";
	import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    let data, code, results;

    function handleFile(event) {
        let files = this.files; /* now you can work with the file list */
        let file = files[0];
        let text;

        const reader = new FileReader();
        reader.onload = (e) => {
            text = JSON.parse(e.target.result);
            if (event.target.id == 'input-data') {
                data = text;
                document.getElementById("input-data-name").textContent += file.name
            }
            if (event.target.id == 'input-code') {
                code = text;
                document.getElementById("input-code-name").textContent += file.name
            }
            if (event.target.id == 'input-results') {
                results = text;
                document.getElementById("input-results-name").textContent += file.name
            }
        };
        reader.readAsText(file);
    }

    function uploadFiles() {
        // if data, code and results are all defined
        console.log(data, code, results)
    }

	onMount(() => {
        const inputs = document.querySelectorAll(".input");
        const buttons = document.querySelectorAll(".input-button");

		buttons.forEach(element => {
            element.addEventListener("click", (e) => {
                    if (e.target.id == "button-data") {
                        inputs[0].click();
                    } else if (e.target.id == "button-code") {
                        inputs[1].click();
                    } else if (e.target.id == "button-results") {
                        inputs[2].click();
                    }
                },
                false);
        });

        inputs.forEach(element => {
            element.addEventListener("change", handleFile, false)
        });
	})

    const dispatch = createEventDispatcher();

	function loadAnalysis(analysis) {
		dispatch('loadAnalysis', {
			mode: analysis
		});
	}
</script>

<div class="welcome">
    <div class="logo-container">
        <img class="logo" alt="logo" src={logo}/>
        <p>Welcome to<br><span class="app-name">Milliways</span></p>
    </div>
	<div class="row">
		<div class="upload-container">
			<p>Upload your own multiverse analysis...</p>
			<div class="input-container">
				<input type="file" id="input-data" class="input" style="display:none" accept="application/JSON"/>
                <button class="input-button" id="button-data" type="button">
                    data
                </button>
                <div class="file-name">
                    <span class="input-file-name" id="input-data-name"></span>
                </div>
			</div>
			<div class="input-container">
				<input type="file" id="input-code" class="input" style="display:none" accept="application/JSON"/>
                <button class="input-button" id="button-code" type="button">
                    code
                </button>
                <span class="input-file-name" id="input-code-name"></span>
			</div>
			<div class="input-container">
				<input type="file" id="input-results" class="input" style="display:none" accept="application/JSON"/>
                <button class="input-button" id="button-results" type="button">
                    results
                </button>
                <span class="input-file-name" id="input-results-name"></span>
			</div>
            <button class="nav-btn upload-new-data" on:click={uploadFiles}>Upload files</button>
		</div>
		<div class="separator"></div>
		<div class="upload-container">
			<p>Explore an implemented analysis...</p>
            <div class="input-container">
                <button class="nav-btn load" on:click={() => loadAnalysis("durante")}>Religiosity dataset</button>
            </div>
            <div class="input-container">
                <button class="nav-btn load" on:click={() => loadAnalysis("hurricane")}>Hurricane dataset</button>
            </div>
            <div class="input-container">
                <button class="nav-btn load" on:click={() => loadAnalysis("social_media")}>Social media dataset</button>
            </div>
		</div>
	</div>    
</div>

<style>
    .welcome {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
    }
 
    .logo-container {
        margin-top: 80px;
    }

	.logo {
		height: 120px;
        width: 120px;
	}

    p {
        font-family: 'Av-Nx', sans-serif;
		line-height: 21px;
		font-size: 14px;
		font-weight: 300;
		color: #4f4f4f;
    }

	span.app-name {
		font-size: 24px;
        font-family: 'Av-Nx', sans-serif;
		color: #4f4f4f;
        line-height: 32px;
	}

    div.file-name {
        overflow: hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
    }

    span.input-file-name {
		font-size: 14px;
        font-family: 'Av-Nx', sans-serif;
		color: #666666;
        line-height: 31px;
	}

	.row {
		display: flex;
		margin: 80px auto;
		width: 761px;
	}

	.upload-container {
		width: 380px;
		height: 300px;
        margin: 0px 60px;
	}

	.separator {
		width: 1px;
		height: 320px;
		background-color: #979797;
	}

	.input-container {
		margin: 16px auto;
        height: 40px;
        width: 100%;
        display: flex;
	}

	.input-button {
        min-width: 80px;
		height: 40px;
		background-color: #f6f6f6;
		border: none;
        color: #298ee7;
		font-family: 'Av-Nx', sans-serif;
		font-size: 14px;
		border-radius: 4px;
		cursor: pointer;
	}

    .input-button:before {
        content: url('../icons/add.svg');
        width: 24px;
        float: left;
    }
	
	button.nav-btn {
		background-color: #f9f9f9;
		border: 2px solid #e0e0e0;
		font-family: 'Av-Nx', sans-serif;
		font-size: 14px;
		color: #4f4f4f;
		border-radius: 8px;
		cursor: pointer;
        margin: 0px auto;
	}

    button.load {
		width: 180px;
		height: 48px;
	}

    button.upload-new-data {
		width: 120px;
		height: 40px;
    }

	button:active,
	button:focus,
	button:hover {
		text-decoration: none;
        color: #298ee7;
		border: 2px solid #298ee7;
	}
</style>