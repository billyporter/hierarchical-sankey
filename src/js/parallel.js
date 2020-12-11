/**
 * Returns an object of the following form:
 * [
 *      [ id, exam1, exam2, exam3, finalExam ],
 *      ...,
 *      [ id, exam1, exam2, exam3, finalExam ]
 * ]
 */
function formatParallelData() {
    result = [];
    Object.entries(rawData).map(x => result.push({ "id": x[0], "Exam 1": x[1]["Exam 1"], "Exam 2": x[1]["Exam 2"], "Exam 3": x[1]["Exam 3"], "Final Exam": x[1][" Final Exam"] }));
    return result;
}

// Get formatted data
let pcData = formatParallelData();
// Define the dimensions of our plot
dimensions = ["Exam 1", "Exam 2", "Exam 3", "Final Exam"];

// build linear scale for y axis
var y = {}
for (i in dimensions) {
    name = dimensions[i]
    const scaleyWaley = examToScale(name, sankeyData, height, padding);
    y[name] = d3.scaleLinear()
        .domain([0, 59.9, 60, 69.9, 70, 79.9, 80, 89.9, 90, 100])
        .range(scaleyWaley)
}

// build linear scale for x axis
x = d3.scalePoint()
    .range([20, width])
    .padding(0)
    .domain(dimensions);

// The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
function path(d) {
    return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
}

woody();

svg
    .selectAll("myPath")
    .data(pcData)
    .enter().append("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.25)

// Draw the axis:
svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .hideAxis(["col1"])
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function (d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
    // Add axis title
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(function (d) { return d; })
    .style("fill", "black")