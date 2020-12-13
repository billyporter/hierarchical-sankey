/**
 * 
 * Links Section
 * 
 */

/* Creates Link */
const graphlink = svg
    .append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(graph.links)
    .enter()

/* Draws Link */
graphlink.append("path")
    .attr("class", "link")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .style("stroke-width", d => d.width)
    .style("stroke", d => sankeyColor(d.source.name))
    .on("mouseover", (d, i) => hoverBehavior(i)) // show PC lines on hover
    .on("mouseout", () => d3.selectAll(".lines").style("visibility", "hidden"));

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
    .attr("x", function (d) { return d.x0 - 6; })
    .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(function (d) { return d.name; })
    .filter(function (d) { return d.x0 < width / 2; })
    .attr("x", function (d) { return d.x1 + 6; })
    .attr("text-anchor", "start");


/* Add hover behvaior for sankey */
const linksArray = document.getElementsByClassName("link");
for (let i = 0; i < linksArray.length; i++) {
    linksArray[i].addEventListener('mouseover', () => hoverBehavior(graph.links[i]), false);
}
