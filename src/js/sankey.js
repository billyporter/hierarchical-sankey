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
    .on("mouseover", (d, i) => {
        if (!isActive) {
            hoverBehavior(i);
        }
    })
    .on("click", (d, i) => {
        isActive = true
        activeLink = i.index;
        hoverBehavior(i);
    })
    .on("mouseout", () => {
        if (!isActive) {
            d3.selectAll(".lines").style("visibility", "hidden");
        }
    });

