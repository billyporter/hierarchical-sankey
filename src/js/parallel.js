/**
 * Returns an object of the following form:
 * [
 *      [ id, exam1, exam2, exam3, finalExam ],
 *      ...,
 *      [ id, exam1, exam2, exam3, finalExam ]
 * ]
 */
function formatParallelData() {
    return Object.entries(rawData).map(x => [x[0], x[1]['Exam 1'], x[1]['Exam 2'], x[1]['Exam 3'], x[1][' Final Exam']]);
}


// set the dimensions and margins of the graph
var margin = {top: 30, right: 10, bottom: 10, left: 0},
    width = 500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#parallel_viz")
.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Get formatted data
let data = formatParallelData();

// Define the dimensions of our plot
dimensions = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];

// build linear scale for y axis
var y = {}
for (i in dimensions) {
    name = dimensions[i]
    y[name] = d3.scaleLinear()
        .domain( d3.extent(data, function(d) { return +d[name]; }) )
        .range([height, 0])
}

// build linear scale for x axis
x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);

function path(d) {
    console.log(d)
    return d3.line()(dimensions.map(function(p) { return [x(p), y[p]]; }));
}

svg
    .selectAll("myPath")
    .data(data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)
