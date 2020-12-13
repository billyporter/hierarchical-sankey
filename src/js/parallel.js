
/**
 * 
 * Nodes Section
 * 
 */

/* Creates Node */
const graphnode = svg
    .append("g")
    .classed("nodes", true)
    .selectAll("rect")
    .data(graph.nodes)
    .enter()

/* Draws Node */
graphnode.append("rect")
    .classed("node", true)
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => (d.x1 - d.x0))
    .attr("height", d => (d.y1 - d.y0))
    .style("fill", (d) => (sankeyColor(d.name)))
    .attr("stroke", (d) => {
        return d3.rgb(sankeyColor(d.name)).darker(0.6);
    });


/* Add in title */
graphnode.append("title")
    .text((d) => d.name + "\n" + " Students");


/* Add in text */
graphnode.append("text")
    .style("font-size", "16px")
    .attr("x", function (d) { return d.x0 - 6; })
    .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(function (d) { return d.name; })
    .filter(function (d) { return d.x0 < width / 2; })
    .attr("x", function (d) { return d.x1 + 6; })
    .attr("text-anchor", "start");


/**
 * Parallel Coordinates Section
 */
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
    .style("visibility", "hidden");