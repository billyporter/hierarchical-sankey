
const width = 900; //890;
const height = 782; //740;
// const legendWidth = 600;
// const legendHeight = 900;
const treeHeight = height;
const treeStart = height + 50 + 75;

/* Sets up svg */
const svg = d3.select("#canvas")
    .attr("width", width + 200)
    .attr("height", height + 200)
    .append("g")
    .attr("transform", "translate(30, 30)");

const treesvg = d3.select("#tree")
    .attr("width", width + 200)
    .attr("height", height + 200)
    .append("g")
    .attr("transform", "translate(30, 30)");