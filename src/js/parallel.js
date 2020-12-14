
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
    .attr("x", function (d) { return d.x0 - 20; })
    .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
    .attr("dy", "0.35em")
    // .attr("text-anchor", "end")
    .text(function (d) { return d.name; })
// .filter(function (d) { return d.x0 < width / 2; })
// .attr("x", function (d) { return d.x1 + 6; })
// .attr("text-anchor", "start");


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
        .domain([0, 59.99999999999999, 60, 69.99999999999999, 70, 79.99999999999999, 80, 89.999999999999, 90, 100])
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
    .style("stroke-width", "1.5")
    .style("opacity", 0.6)
    .style("visibility", "hidden");


/**
 * Draws Axes
 */

/* Create Map for grades */
const gradeMap = new Map();
gradeMap.set('A', 90);
gradeMap.set('B', 80);
gradeMap.set('C', 70);
gradeMap.set('D', 60);
gradeMap.set('F', 0);

/**
 * Loop through nodes and draw axes
 */
svg.selectAll('.node').each(function (d, i) {
    /* Variables */
    const data = [];
    let start = gradeMap.get(d['name']);
    const end = start + 11;
    let inc = 1;

    /* Change number of points depending on size */
    const size = d['y1'] - d['y0'];
    if (size > 240) {
        inc = 1;
    }
    else if (size > 110) {
        inc = 2;
    }
    else if (size > 65) {
        inc = 5;
    }
    else if (size > 35) {
        inc = 10;
    }
    else {
        start = end;
    }

    for (let i = start; i < end; i += inc) {
        data.push(i);
    }

    /* Create point scale */
    var scale = d3.scalePoint()
        .domain(data)
        .range([d["y1"], d["y0"]]);

    /* Add scale to axis */
    var y_axis = d3.axisRight()
        .scale(scale);

    /* Append to svg */
    svg.append("g")
        .attr("transform", "translate(" + d['x1'] + ", 0)")
        .attr('class', 'axes')
        .call(y_axis)
        .style("visibility", "hidden");
});


