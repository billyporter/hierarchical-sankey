const sankeyData = formatSankeyData(rawData);

/* Sets up svg */
const svg = d3.select("#canvas")
    .attr("width", width)
    .attr("height", height)
    .append("g");

/* Creates Sankey Object */
const sankey = d3.sankey()
    .size([width, height])
    .nodeId(d => d.id)
    .nodeWidth(nodeWdt)
    .nodePadding(padding)
    .nodeAlign(d3.sankeyCenter)
    .nodeSort(null);

/* Draws Sankey on SVG */
const graph = sankey(sankeyData);

/**
 * 
 * Links Section
 * 
 */

/* Creates Link */
const graphlink = svg
    .append("g")
    .classed("links", true)
    .selectAll("path")
    .data(graph.links)
    .enter()

/* Draws Link */
graphlink.append("path")
    .classed("link", true)
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .style("stroke-width", d => d.width)
    .style("stroke", d => sankeyColor(d.source.name))
    .style("stroke-opacity", 0.4);



/**
 * 
 * Nodes Section
 * 
 */

/* Creates Node */
const graphnode = svg
    .append("g")
    .classed("nodes", true)
    .selectAll("rect")
    .data(graph.nodes)
    .enter()

/* Draws Node */
graphnode.append("rect")
    .classed("node", true)
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => (d.x1 - d.x0))
    .attr("height", d => (d.y1 - d.y0))
    .style("fill", (d) => (sankeyColor(d.name)))
    .attr("stroke", (d) => {
        return d3.rgb(sankeyColor(d.name)).darker(0.6);
    });


/* Add in title */
graphnode.append("title")
    .text((d) => d.name + "\n" + " Students");


/* Add in text */
graphnode.append("text")
    .style("font-size", "16px")
    .attr("x", -6)
    .attr("y", function (d) { return (d.y1 - d.y0) / 2; })
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(function (d) {
        var t = d.name;
        t = t[t.length - 1];
        return t;
    })