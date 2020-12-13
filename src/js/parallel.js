
/* Builds the custom y-Scale and x-scale */
var y = {}
dimensions = ["Exam 1", "Exam 2", "Exam 3", "Final Exam"];
for (i in dimensions) {
    namer = dimensions[i]
    const scaleyWaley = nodeValueToScale(i, sankeyData);
    y[namer] = d3.scaleLinear()
        .domain([0, 59.99, 60, 69.99, 70, 79.99, 80, 89.99, 90, 100])
        .range(scaleyWaley)
}
x = d3.scalePoint()
    .range([nodeWdt, width])
    .padding(0)
    .domain(dimensions);

/* 
    The path function take a row of the csv as input
    and return x and y coordinates of the line to draw for this raw.
*/
function path(d) {
    return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
}

/* Draws Plot */
svg
    .selectAll("yPath")
    .data(pcData)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "lines")
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.25)
    .style("visibility", "hidden" );