
/**
 * Build Bar Graph Legend For plot
 */
function buildLegend(colorArray, rankedArray, filteredData, source_targets) {

    /* Constants needed to build graph */
    const barData = buildBarGraphData(rankedArray, colorArray);
    const axisData = buildAxisData(barData);
    const numBars = rankedArray.length < 8 ? rankedArray.length : 8;
    const barHeight = 400;
    const barPadding = 15;
    const barWidth = 60;
    const startingX = 1100;

    /* builds y axis */
    var y = d3.scaleOrdinal()
        .domain(Object.keys(axisData).map(x => axisData[x].Exam))
        .range(Object.keys(axisData).map(x => x * 25));

    var yAxis = d3.axisLeft()
        .scale(y)
        .tickFormat(d => {
            if (isNaN(d) && d.localeCompare("dummy") !== 0) {
                return d;
            }
        })
        .tickSizeOuter(0); // remove axis brackets

    svg.append("g")
        .attr("class", "legendYAxis")
        .attr("transform", "translate(" + (startingX - 10) + ", 100)")
        .call(yAxis)
        .call(g => g.selectAll(".tick line")
            .filter(d => {
                return d.localeCompare("dummy") === 0;
            })
            .attr("x2", barPadding + 2 * Math.max(...Object.keys(barData).map(x => barData[x].Students))) // extend the y=0 line to form a joined y and x axis
        )
        .call(g => g.selectAll(".tick")
            .filter(function (d) {
                return !isNaN(d); // remove the dummy data (0, 1, 2, ...) to leave spaced out ticks in the middle of the data
            })
            .remove()
        )
        .style("font-size", "12px");

    /* builds x axis */
    var x = d3.scaleLinear()
        .domain([0, Math.max(...Object.keys(barData).map(x => barData[x].Students))])
        .range([0, 2 * Math.max(...Object.keys(barData).map(x => barData[x].Students))]);

    var xAxis = d3.axisBottom()
        .scale(x)
        .ticks(x.domain()[1] / 10);

    svg.append("g")
        .attr("class", "legendXAxis")
        .attr("transform", "translate(" + (startingX) + ", " + (100 + 50 * numBars) + ")")
        .call(xAxis)
        .call(g => g.select('.domain')
            .remove());



    /* Get padding for pathway label */
    let longestLength = 0;
    for (const currLabel of rankedArray) {
        if (currLabel[0].length > longestLength) {
            longestLength = currLabel[0].length
        }
    }
    let pathwayPadding = 3 * longestLength;

    /* y axis label */
    svg.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("class", "legendYAxisLabel")
        .attr("transform", "translate(" + (startingX - 88 - pathwayPadding) + "," + (80 + 30 * numBars) + ") rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-weight", "600")
        .style("font-size", "14px")
        .text("Pathway");

    /* x axis label */
    svg.append("text")
        .attr("x", startingX + Math.max(...Object.keys(barData).map(x => barData[x].Students)))
        .attr("y", 140 + 50 * numBars)
        .attr("class", "legendXAxisLabel")
        .style("text-anchor", "middle")
        .style("font-weight", "600")
        .style("font-size", "14px")
        .text("Students");

    /* title */
    svg.append("text")
        .attr("x", startingX + Math.max(...Object.keys(barData).map(x => barData[x].Students)))
        .attr("y", 65)
        .attr("class", "legendTitle")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text("Counts of Pathways Passing Through");

    svg.append("text")
        .attr("x", startingX + Math.max(...Object.keys(barData).map(x => barData[x].Students)))
        .attr("y", 85)
        .attr("class", "legendTitle")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text(function (d) {
            title = "Grade " + source_targets[0] + " on " + source_targets[2]
                + " and Grade " + source_targets[1] + " on " + source_targets[3];
            return title;
        });

    /* Build domain for graph */
    domainY = []
    for (let i = 0; i < 9; i++) {
        domainY.push(i);
    }

    var bar_y = d3.scalePoint()
        .range([0, barHeight])
        .domain(domainY);

    /* Draw Bars */
    const bars = svg.selectAll(".bar").data(barData);
    bars
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", function (d, i) {
            return bar_y(i) + 100;
        })
        .attr("height", barWidth - barPadding)
        .attr("x", startingX)
        .attr("width", function (d) {
            return d.Students * 2;
        })
        .style('fill', function (d, i) {
            return colorArray[i];
        })
        .on('mouseover', function (d, i) {
            highlightGroup(colorArray, filteredData, i['Exam']);
            d3.select(this).style('fill', "#ff79c6");
        })
        .on('mouseout', function (d, i) {
            setDefaults();
            d3.select(this).style('fill', colorArray[groupsList.indexOf(i.Exam)]);
        })

    /* Draw numeric labels to right of bar */
    const students = svg.selectAll(".label").data(barData);
    students
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("y", function (d, i) {
            return bar_y(i) + 130;
        })
        .attr("x", function (d) {
            return startingX + 25 + d.Students * 2;
        })
        .text(function (d) {
            return d.Students;
        })
        .style("fill", "black")
}

/**
 * Function to remove legend
 */
function clearPrevLegend() {
    d3.selectAll(".bar").remove();
    d3.selectAll(".label").remove();
    d3.selectAll(".exam").remove();
    d3.selectAll(".legendYAxis").remove();
    d3.selectAll(".legendXAxis").remove();
    d3.selectAll(".legendTitle").remove();
    d3.selectAll(".legendYAxisLabel").remove();
    d3.selectAll(".legendXAxisLabel").remove();
}

/**
 * Returns of Form:
 * [ 
 *      {Exam: examConcat, Students: "count"}
 * ]
 */
function buildBarGraphData(rankedArray, colorArray) {
    clearPrevLegend();
    barData = []
    let i = 0;
    for (let group of rankedArray) {
        barData.push({ "Exam": group[0], "Students": group[1] });
        i += 1;
        if (i == 8) {
            break;
        }
    }
    return barData;
}

/**
 * Returns dummy data inserted in the barGraph array to properly scale and style the y-axis 
 */
function buildAxisData(barData) {
    const axisData = [{ "Exam": "0" }];
    for (let [i, exam] of barData.entries()) {
        axisData.push(exam);
        if (i < barData.length - 1) {
            axisData.push({ "Exam": "" + (1 + i) });
        }
    }

    axisData.push({ "Exam": "dummy" });

    return axisData;
}

/**
 * When hovering over bar, highlights appropriate lines
 */
function highlightGroup(colorArray, filteredData, group) {
    d3.selectAll(".lines").each(function (d) {
        d3.select(this)
            .style("stroke", () => {
                return d['concat'] === group ? "#ff79c6" : deflineColor; // set line highlight color
            })
            .style("opacity", () => {
                return d['concat'] === group ? 1 : 0.5;
            })
            .style("stroke-width", () => {
                return d['concat'] === group ? 2.5 : 1.0;
            });
    });
}

function setDefaults() {
    d3.selectAll(".lines").each(function (d) {
        d3.select(this)
            .style("stroke", () => {
                return deflineColor;
            })
            .style("opacity", () => {
                return 0.6;
            })
            .style("stroke-width", () => {
                return 1.5;
            });
    });
}
