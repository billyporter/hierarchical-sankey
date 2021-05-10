breakdownJS();
// treeJS();
var graphChoices = ["Breakdown", "Color", "Tree", "Hierarchy"]
// var form = d3.select("body").append("form").attr("transform", "translate(40,0)");
// graphLabels = form.selectAll("label")
//     .data(graphChoices)
//     .enter()
//     .append("label")
//     .attr("x", 1300)
//     .text(function (d) { return d; })
//     .insert("input")
//     .attr("type", "radio")
//     // .attr("y", 300)
//     .attr("transform", "translate(40,0)");

// d3.select("#canvas").append("text")
//     .attr("x", 1300)
//     .attr("y", 500)
//     .text("BILY")
//     .style("fill", "#000000")
//     .style("font-weight", "bold")
//     .style("opacity", 1.0)


document.graphChoice[0].addEventListener('change', function () {
    d3.selectAll("svg > *").remove();
    breakdownJS();
})

document.graphChoice[1].addEventListener('change', function () {
    d3.selectAll("svg > *").remove();
    colorJS();
})

document.graphChoice[2].addEventListener('change', function () {
    d3.selectAll("svg > *").remove();
    treeJS();
})

document.graphChoice[3].addEventListener('change', function () {
    d3.selectAll("svg > *").remove();
    hierJS();
})