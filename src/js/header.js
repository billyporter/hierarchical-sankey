
const width = 900; //890;
const height = 782; //740;
const legendWidth = 600;
const legendHeight = 900;

/* Sets up svg */
const svg = d3.select("#canvas")
    .attr("width", width + legendWidth)
    .attr("height", height + legendHeight)
    .append("g")
    .attr("transform", "translate(30, 30)");