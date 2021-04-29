
/* Creates title for the graph */
svg.append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", -15)
    .style("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "600")
    .text("Exam Grade Pathways");

function setLabels(graph) {
    console.log(graph);
    console.log(assessments)
    const examGraphLabel = [];
    let assessIndex = 0;
    for (const node of graph.nodes) {
        // console.log(node);
        if (node.assessment === assessments[assessIndex].trim()) {
            examGraphLabel.push((node.x0 + node.x1) / 2);
            assessIndex += 1;
        }
        if (assessIndex === assessments.length) {
            break;
        }
    }
    console.log(examGraphLabel);

    /* Adds x axis labels of pathway */
    svg.append("text")
        .attr("class", "axis-label")
        .attr("y", height + 25)
        .attr("x", examGraphLabel[0])
        .style("text-anchor", "middle")
        .text("Exam 1");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("y", height + 25)
        .attr("x", examGraphLabel[1])
        .style("text-anchor", "middle")
        .text("Exam 2");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("y", height + 25)
        .attr("x", examGraphLabel[2])
        .style("text-anchor", "middle")
        .text("Exam 3");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("y", height + 25)
        .attr("x", examGraphLabel[3])
        .style("text-anchor", "middle")
        .text("Final Exam");
}




var button = svg.append("rect")
    .attr("x", width / 2 - 100)
    .attr("y", height + 75)
    .attr("width", 200)
    .attr("height", 50)
    .attr("class", "resetButton")
    .style("fill", "#FFFFFF")
    .style("stroke", "#000000")
    .style("stroke-width", "2")
    .style("fill-opacity", 0.0)
    .style("rx", "12")
    .style("ry", "12")
    .classed("button", true)
    .on("mouseover", function (d) {
        d3.select(this)
            .style("fill", "#DEDEDE")
            .style("fill-opacity", 0.7);
    })
    .on("mouseout", function (d) {
        d3.select(this)
            .style("fill", "#000000")
            .style("fill-opacity", 0.0);
    })
    .on("click", () => resetGraph());


/* Adds reset button */
svg.append("text")
    .attr("x", width / 2 - 25)
    .attr("y", height + 105)
    .classed("button", true)
    .text("RESET")
    .style("fill", "#000000")
    .style("font-weight", "bold")
    .style("opacity", 1.0)
    .on("mouseover", function (d) {
        d3.select(".resetButton")
            .style("fill", "#DEDEDE")
            .style("fill-opacity", 0.7);
    })
    .on("mouseout", function (d) {
        d3.select(".resetButton")
            .style("fill", "#000000")
            .style("fill-opacity", 0.0);
    })
    .on("click", () => resetGraph());

