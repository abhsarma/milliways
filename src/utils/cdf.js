/**
 * function for drawing the outcome CDF for (one or more) coefficient(s) per universe
 * 
 * @param {array of arrays} data Contains x, y_lower and y_upper values to draw p-boxes for a coefficient for each universe
 * @param {integer} i index corresponding to the outcome plot being drawn
 * @param {integer} size # of universes in the multiverse
 * @param {function} yscale A D3 scale definition for y position of each universe
 * @param {string} term Coefficient name
 **/
export function CDF (data, estimate, i, size, yscale, term, gridState) {
	const height = size * (cell.height + cell.padding); // to fix as D3 calculates padding automatically
	// let ypos = namingDim + 4 * cell.padding;

	let domain = d3.extent(data.map(d => d.map(x => x[0])).flat())

	let xscale = d3.scaleLinear()
		.domain(d3.extent(data.map(d => d.map(x => x[0])).flat()))
		.range([margin.left, outVisWidth]);

	let y = d3.scaleLinear()
		.domain([0, 0.5])
		.range([(yscale.step() - cell.padding), 0]);

	let outcomePlot = d3.select('svg.outcome-results.vis-' + i).selectAll(`g.outcomePanel.plot-${i}`)
		.data([null])
		.join("g")
		.attr("class", `outcomePanel plot-${i}`)
		.attr("transform", `translate(0,  ${gridNamesHeight})`)

	let axisPlot = d3.select(`svg.outcome-axis.vis-${i}`).selectAll(`g.outcome-headers.plot-${i}`)
		.data([null])
		.join("g")
		.attr("class", `outcome-headers plot-${i}`)
		.attr("transform", `translate(0,  ${gridNamesHeight})`)

	let intercept = axisPlot
		.selectAll('.zero-line')
		.data([data])
		.join(
			enter => enter.append("line")
					.attr('class', 'zero-line')
					.attr("x1", xscale(0))
					.attr("x2", xscale(0)),
			update => update
					.attr("x1", xscale(0))
					.attr("x2", xscale(0)),
			exit => exit.remove()
		)
		.attr("y1", 0)
		.attr("y2", windowHeight - gridNamesHeight - margin.bottom)
		.attr("transform", `translate(0, ${yscale(0) - cell.padding})`)
		.attr("stroke", `${colors.gray}`)
		.attr("stroke-width", 2);

	// add a group for each universe
	let panelPlot = d3
		.select(`g.outcomePanel.plot-${i}`)
		.selectAll(".universe")
		.data(data)
		.join(
			enter => enterCDF(enter, estimate, term, area, line, xscale, yscale, y, gridState),
			update => updateCDF(update, estimate, area, line, xscale, yscale, y, gridState),
			exit => exitCDF(exit)
		)

	if (axisPlot.select('.x-axis').node()) {
		axisPlot.select(".x-axis")
			.call(d3.axisTop(xscale).ticks(5))
			.call(g => g.selectAll(".tick line") //.clone()
				.attr("y2", windowHeight - gridNamesHeight - margin.bottom)
				.attr("stroke-opacity", 0.1)
			)
			.style("font-size", "12px");
	} else {
		axisPlot.append('g')
			.attr("class", "x-axis")
			.attr("transform", `translate(0, ${yscale(0) - cell.padding})`)
			.append("rect")
			.attr("x", 0)
			.attr("y", -margin.top)
			.attr("height", margin.top)
			.attr("width", "100%")
			.attr("fill", colors.background);

		axisPlot.select('.x-axis')
			.call(d3.axisTop(xscale).ticks(5))
			.call(g => g.selectAll(".tick line").clone()
				.attr("y2", windowHeight - gridNamesHeight - margin.bottom)
				.attr("stroke-opacity", 0.1)
			)
			.style("font-size", "12px");
	}
}

// helper function called by CDF
function enterCDF(enter, estimate, term, area, line, xscale, yscale, y, gridState) {
	enter.append('g')
		.attr("class", (d, i) => `universe universe-${i} ${term}`)
		.attr("transform", (d, i) => `translate(0, ${yscale(i)})`)
		.call( g => {
				g.append("path")
					.attr("class", "cdf")
					.datum((d, i) => d)
					.attr("fill", `${colors.secondary}`)
					.attr("stroke", `${colors.secondary}`)
					.attr("stroke-width", 1.5)
					.attr("d", area(xscale, y))

				g.append("path")
					.attr("class", "median")
					.datum((d, i) => {
						if (estimate[i].length === undefined) return [[Math.min(estimate[i]), 0.5], [Math.max(estimate[i]), 0.5]]
							else return [[Math.min(...estimate[i]), 0.5], [Math.max(...estimate[i]), 0.5]]
					})
					.attr("fill", `${colors.primary}`)
					.attr("stroke", `${colors.primary}`)
					.attr("stroke-width", 2)
					.attr("d", line(xscale, y))

				g.append("circle")
					.datum((d, i) => {
						if (estimate[i].length === undefined) return estimate[i]
							else return mean(...estimate[i])
					})
					.attr("fill", `${colors.primary}`)
					.attr("stroke", `${colors.primary}`)
					.attr("cx", d => xscale(d))
					.attr("cy", y(0.5))
					.attr("r", 0.5)
			}
		)
}

// helper function called by CDF
function updateCDF(update, estimate, area, line, xscale, yscale, y, gridState) {
	update
		.attr("transform", (d, i) => `translate(0, ${yscale(i)})`)
		.call(g => {
			g.select('path.cdf')
				.datum((d, i) => d)
				.attr("d", area(xscale, y))

			g.select("path.median")
				.datum((d, i) => {
					if (estimate[i].length === undefined) return [[Math.min(estimate[i]), 0.5], [Math.max(estimate[i]), 0.5]] 
						else return [[Math.min(...estimate[i]), 0.5], [Math.max(...estimate[i]), 0.5]]
				})
				.attr("d", line(xscale, y))

			g.select('circle')
				.datum((d, i) => {
					if (estimate[i].length === undefined) return estimate[i]
						else return mean(...estimate[i])
				})
				.attr("cx", d => xscale(d))
				.attr("cy", y(0.5))
		})
}

// helper function called by CDF
function exitCDF(exit) {
	exit.call(g => g.remove())
}