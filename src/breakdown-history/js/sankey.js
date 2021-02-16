
/**
 * 
 * Nodes Section
 * 
 */


var graph;

/* Creates Sankey Object */
let sankey = d3.sankey()
    .size([width, height])
    .nodeId(d => d.id)
    .nodeWidth(nodeWdt)
    .nodePadding(padding)
    .nodeAlign(d3.sankeyCenter)
    .nodeSort(null);

/**
 * Top level Sankey drawing function
 */
function drawSankey(sankeyData) {
    graph = sankey(sankeyData);
    /* First draw nodes and draw links according to these old values */
    drawNodes(graph);
    drawLinks(graph);
    console.log(graph);
}


/**
 * 
 * Function to draw nodes of sankey
 */
function drawNodes(graph) {
    /* Creates Node */
    var graphnode = svg
        .append("g")
        .classed("nodes", true)
        .selectAll("rect")
        .data(graph.nodes)
        .enter()

    /* Draws Node */
    graphnode.append("rect")
        .attr("class", "node")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => (d.x1 - d.x0))
        .attr("height", d => {
            d.rectHeight = d.y1 - d.y0;
            return (d.y1 - d.y0)
        })
        .style("fill", (d) => {
            return sankeyColor(d.name)
        })
        .attr("stroke", (d) => {
            return d3.rgb(sankeyColor(d.name)).darker(0.6);
        })
        .on("click", function (d, i) {
            // hierarchSankeyRouter(i, true);
        })
        .on("contextmenu", function (d, i) {
            // d.preventDefault();
            // hierarchSankeyRouter(i, false);
        });


    /* Add in title */
    graphnode.append("title")
        .text((d) => d.name + "\n" + " Students")


    /* Add in text */
    graphnode.append("text")
        .style("font-size", "16px")
        .attr("class", "nodeText")
        .attr("x", function (d) { return d.x0 - 30; })
        .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
        .attr("dy", "0.35em")
        .text(function (d) { return d.name; });

}



/**
 * 
 * Links Section
 * 
 */

/**
 * 
 * Function to draw Links of Sankey
 */
var graphlink;
function drawLinks(graph) {

    /* Creates Link */
    graphlink = svg
        .append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.links)
        .enter()
        .append("path")

    /* Draws Link */
    graphlink
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("fill", "none")
        .style("stroke-width", d => d.width)
        .style("stroke", d => {
            return sankeyColor(d.source.name);
        });
}
