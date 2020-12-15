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

let nah = true
document.addEventListener("click", function (event) {
    const target = event.target;
    if (!target.closest('.link')) {
        console.log('back on!');
        isActive = false;
        d3.selectAll(".lines")
            .style("visibility", "hidden")
        d3.selectAll(".link").style('pointer-events', 'auto');
        d3.selectAll(".axes")
            .style("visibility", "hidden");
        clearPrevLegend();
    }
})

/* Draws Link */
graphlink.append("path")
    .attr("class", "link")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .style("stroke-width", d => d.width)
    .style("stroke", d => sankeyColor(d.source.name))
    .on("mouseover", (d, i) => {
        if (!isActive) {
            hoverBehavior(i, false);
            d3.selectAll(".axes").style("visibility", "visible");
        }
    })
    .on("click", function (d, i) {
        isActive = true
        activeLink = i.index;
        hoverBehavior(i, true);
        d3.selectAll(".link").style('pointer-events', 'none');
        console.log('off!');
        d3.selectAll(".axes").style("visibility", "visible");
    })
    .on("mouseout", () => {
        if (!isActive) {
            d3.selectAll(".lines").style("visibility", "hidden");
            d3.selectAll(".axes").style("visibility", "hidden");
        }
    });

