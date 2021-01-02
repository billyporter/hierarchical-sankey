/* Creates title for the graph */
svg.append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", -15)
    .style("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "600")
    .text("Exam Grade Pathways");

/* Adds x axis labels of pathway */
svg.append("text")
    .attr("class", "axis-label")
    .attr("y", height + 25)
    .attr("x", 20)
    .style("text-anchor", "middle")
    .text("Exam 1");

svg.append("text")
    .attr("class", "axis-label")
    .attr("y", height + 25)
    .attr("x", width / 3 + 8)
    .style("text-anchor", "middle")
    .text("Exam 2");

svg.append("text")
    .attr("class", "axis-label")
    .attr("y", height + 25)
    .attr("x", width * 2 / 3 - 4)
    .style("text-anchor", "middle")
    .text("Exam 3");

svg.append("text")
    .attr("class", "axis-label")
    .attr("y", height + 25)
    .attr("x", width - 15)
    .style("text-anchor", "middle")
    .text("Final Exam");

/* Adds reset button */
var button = svg.append("rect")
    .attr("x", width / 2 - 100)
    .attr("y", height + 75)
    .attr("width", 200)
    .attr("height", 50)
    .style("fill", '#FFFFFF')
    .style("stroke", '#000000')
    .classed("button", true)
    .on("click", () => resetGraph());

svg.append("text")
    .attr("x", width / 2 - 25)
    .attr("y", height + 105)
    .classed("button", true)
    .text("Reset")
    .on("click", () => resetGraph());