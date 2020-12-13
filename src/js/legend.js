
/**
 * Build Legend For plot
 */

function buildLegend(colorArray, rankedArray) {

    // const legendX = width + legendWidth / 2;
    // clearPrevLegend();
    // for (let i = 0; i < rankedArray.length && i < 8; i++) {
    //     svg.append("circle")
    //         .attr("cx", legendX)
    //         .attr("cy", 130 + 30 * i)
    //         .attr("r", 6)
    //         .style("fill", colorArray[i])
    //         .attr("class", "leg");
    //     svg.append("text")
    //         .attr("x", legendX + 30)
    //         .attr("y", 130 + 30 * i)
    //         .text(rankedArray[i][0] + " " + rankedArray[i][1])
    //         .style("font-size", "15px")
    //         .attr("alignment-baseline", "middle")
    //         .attr("class", "leg");
    // }
    const barData = buildBarGraphData(rankedArray, colorArray);
    console.log(barData);
}

function clearPrevLegend() {
    d3.selectAll(".leg").remove();
}

/**
 * Returns of Form:
 * [ 
 *      {Exam: examConcat, Students: "count"}
 * ]
 */
function buildBarGraphData(rankedArray, colorArray) {
    d3.selectAll(".bar").remove();
    barData = []
    let i = 0;
    for (let group of rankedArray) {
        barData.push({ "Exam": group[0], "Students": group[1] });
        i += 1;
        if (i == 8) {
            break;
        }
    }

    const numBars = rankedArray.length < 8 ? rankedArray.length : 8;
    const barHeight = 200;
    const barPadding = 15;
    const barWidth = 30;

    var bar_x = d3.scaleLinear()
        .range([0, 145])
        .domain([0, 200]);

    domainY = []
    for (let i = 0; i < 9; i++) {
        domainY.push(i);
    }

    var bar_y = d3.scalePoint()
        .range([0, barHeight])
        .domain(domainY);

    const bars = svg.selectAll(".bar").data(barData);
    bars
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", function (d, i) {
            console.log(d, i);
            console.log(bar_y(i));
            return bar_y(i) + 150;
        })
        .attr("height", barWidth - barPadding)
        .attr("x", 800)
        .attr("width", function (d) {
            return d.Students;
        })
        .style('fill', function (d, i) {
            return colorArray[i];
        })

    return barData;
}
