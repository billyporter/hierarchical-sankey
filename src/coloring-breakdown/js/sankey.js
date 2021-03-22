
/**
 * 
 * Nodes Section
 * 
 */

var oldGraphPoints = {};
var newGraphPoints = {};
var oldLinks = {}
var newLinks = {}
var oldLinksMap = new Map();
var newLinksMap = new Map();
var graph;
var oldGraph;
var transitionDuration = 400;

/* New for coloring */
var oldGraphLinks = {};

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
function drawSankey(sankeyData, isFirst, oldData) {
    /* Keep copy of old graph for animation purposes */
    if (oldData) {
        oldGraph = sankey(oldData);
    }


    graph = sankey(sankeyData);
    if (!isFirst) {
        oldGraphLinks = {};
        for (const link of oldGraph.links) {
            const linkLevel = assessGradeLevelMap[link.source.assessment][link.source.name];
            if (linkLevel === 1) {
                oldGraphLinks[link.target.name] = { "y0": link.y0, "y1": link.y1, "width": link.width, "totalWidth": 0 };
            }
        }
        let totalWidth = 0;
        for (const link of graph.links) {
            if (link["sourceName"]) {
                oldGraphLinks[link.target.name]["totalWidth"] += link.width;
            }
        }
        console.log(totalWidth);
        let prev_y0;
        let prev_y1;
        let prev_width = 0;
        // for (const link of graph.links) {
        //     if (link["sourceName"]) {
        //         if (link.sourceName === 'A') {
        //             prev_y0 = oldGraphLinks[link.target.name]["y0"] - 0.5 * oldGraphLinks[link.target.name]["width"] + 0.5 * link.width;
        //             prev_y1 = oldGraphLinks[link.target.name]["y1"] - 0.5 * oldGraphLinks[link.target.name]["width"] + 0.5 * link.width;;
        //             prev_width = 0;
        //         }
        //         else {
        //             link.y0 = prev_y0 + 0.5 * prev_width + 0.5 * link.width;
        //             link.y1 = prev_y1 + 0.5 * prev_width + 0.5 * link.width;
        //         }
        //         // link.y0 = oldGraphLinks[link.target.name]["y0"];
        //         // link.y1 = oldGraphLinks[link.target.name]["y1"];
        //         // link.width = 1; // oldGraphLinks[link.target.name]["width"];

        //         prev_y0 = link.y0;
        //         prev_width = link.width;
        //         prev_y1 = link.y1;
        //     }
        // }
        console.log(graph.links);
    }
    drawNodes(graph);
    drawLinks(graph);
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
            return sankeyColor(d.name[0])
        })
        .attr("stroke", (d) => {
            return d3.rgb(sankeyColor(d.name[0])).darker(0.6);
        })
        .on("click", function (d, i) {
            hierarchSankeyRouter(i, true);
        })
        .on("contextmenu", function (d, i) {
            // d.preventDefault();
            // hierarchSankeyRouter(i, false);
        });

    /* Add in text */
    graphnode.append("text")
        .style("font-size", "16px")
        .attr("class", "nodeText")
        .attr("x", function (d) { return d.x0 - 30; })
        .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
        .attr("dy", "0.35em")
        .text(function (d) { return d.name[0]; });

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
            if (d.sourceName) {
                return sankeyColor(d.sourceName);
            }
            return sankeyColor(d.source.name[0]);
        });
}