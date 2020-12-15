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
    .attr("x", width/3 + 8)
    .style("text-anchor", "middle")
    .text("Exam 2");

svg.append("text")
    .attr("class", "axis-label")
    .attr("y", height + 25)
    .attr("x", width*2/3 - 4)
    .style("text-anchor", "middle")
    .text("Exam 3");

svg.append("text")
    .attr("class", "axis-label")
    .attr("y", height + 25)
    .attr("x", width - 15)
    .style("text-anchor", "middle")
    .text("Final Exam");