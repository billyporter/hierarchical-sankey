
/**
 * Build Bar Graph Legend For plot
 */
function buildLegend(colorArray, rankedArray, filteredData) {

    /* Constants needed to build graph */
    const barData = buildBarGraphData(rankedArray, colorArray);
    const numBars = rankedArray.length < 8 ? rankedArray.length : 8;
    const barHeight = 400;
    const barPadding = 15;
    const barWidth = 60;
    const startingX = 1100;

    /* builds y axis */
    var y = d3.scaleOrdinal()
        .domain(Object.keys(barData).map(x => barData[x].Exam))
        .range(Object.keys(barData).map(x => x*50));
    
    var yAxis = d3.axisLeft()
        .scale(y);

    svg.append("g")
        .attr("class", "legendYAxis")
        .attr("transform", "translate(" + (startingX - 10) + ", 123)")
        .call(yAxis);

    /* builds x axis */
    var x = d3.scaleLinear()
        .domain([0, Math.max(...Object.keys(barData).map(x => barData[x].Students))])
        .range([0,2*Math.max(...Object.keys(barData).map(x => barData[x].Students))]);
    
    var xAxis = d3.axisBottom()
        .scale(x);

    svg.append("g")
        .attr("class", "legendXAxis")
        .attr("transform", "translate(" + (startingX) + ", " + (100 + 50 * numBars) + ")")
        .call(xAxis);

    /* y axis label */
    svg.append("text")
        .attr("x", 0)
        .attr("y",  0)
        .attr("class", "legendYAxisLabel")
        .attr("transform", "translate(" + (startingX - 90) + "," + (80 + 30 * numBars) + ") rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-weight", "600")
        .text("Date");

    /* title */
    svg.append("text")
        .attr("x", startingX + Math.max(...Object.keys(barData).map(x => barData[x].Students)))             
        .attr("y", 85)
        .attr("class", "legendTitle")
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("font-weight", "600")
        .text("Pathway Counts");

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
            d3.select(this).style('opacity', 0.5);
        })
        .on('mouseout', function (d, i) {
            highlightGroup(colorArray, filteredData, '');
            d3.select(this).style('opacity', 1.0);
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
 * When hovering over bar, highlights appropriate lines
 */
function highlightGroup(colorArray, filteredData, group) {
    d3.selectAll(".lines").each(function (d) {
        d3.select(this)
            .style("stroke", () => {
                return d['concat'] === group ? colorArray[d['group']] : deflineColor;
            })
            .style("opacity", () => {
                return d['concat'] === group ? 1 : 0.6;
            });
    });
}
