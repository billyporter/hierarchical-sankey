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


// // set the dimensions and margins of the graph
// var margin = { top: 30, right: 10, bottom: 10, left: 0 },
//     width = 500 - margin.left - margin.right,
//     height = 400 - margin.top - margin.bottom;

// // append the svg object to the body of the page
// var svg = d3.select("#parallel_viz")
//     .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform",
//         "translate(" + margin.left + "," + margin.top + ")");


// Get formatted data
let pcData = formatParallelData();
console.log(pcData);
// Define the dimensions of our plot
dimensions = ["Exam 1", "Exam 2", "Exam 3", "Final Exam"];

// build linear scale for y axis
var y = {}
// for (i in dimensions) {
//     name = dimensions[i]
//     y[name] = d3.scaleLinear()
//         .domain(d3.extent(pcData, function (d) { return +d[name]; }))
//         .range([height, 0])
// }
for (i in dimensions) {
    name = dimensions[i]
    y[name] = d3.scaleLinear()
        .domain([0, 10, 60, 85, 90, 100])
        .range([height, height * 0.8, height * 0.6, height * 0.4, height * 0.2, height * 0.0])
}
console.log(d3.extent(pcData, function (d) { return +d[name]; }));

// build linear scale for x axis
x = d3.scalePoint()
    .range([20, width])
    .padding(0)
    .domain(dimensions);

// The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
function path(d) {
    return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
}

svg
    .selectAll("myPath")
    .data(pcData)
    .enter().append("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

// Draw the axis:
svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
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