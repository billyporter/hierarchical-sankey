
/**
 * 
 * Nodes Section
 * 
 */

/* Creates Sankey Object */
const sankey = d3.sankey()
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
    /* Fomats Sankey */
    const graph = sankey(sankeyData);

    /* Calls functions */
    drawNodes(graph);
    drawPC(sankeyData);
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
        .classed("node", true)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => (d.x1 - d.x0))
        .attr("height", d => (d.y1 - d.y0))
        .style("fill", (d) => {
            /* case for whole letter grade nodes */
            if (letrs.has(d.name))
                return sankeyColor(d.name);

            /* case for + and - grade nodes */
            if (letrs.has(d.name[0]))
                return getShadePlusMinus(sankeyColor(d.name[0]), d.name[1]);

            /* case for number grade nodes */ 
            return getShadeNumber(sankeyColor(gradeScale(d.name)), d.name);
        })
        .attr("stroke", (d) => {
            /* If a letter */
            if (letrs.has(d.name[0])) {
                return d3.rgb(sankeyColor(d.name[0])).darker(0.6);
            }
            return d3.rgb(sankeyColor(gradeScale(d.name))).darker(0.6);
        })
        .on("click", function (d, i) {
            wanedilliams(i);
        });


    /* Add in title */
    graphnode.append("title")
        .text((d) => d.name + "\n" + " Students");


    /* Add in text */
    graphnode.append("text")
        .style("font-size", "16px")
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
function drawLinks(graph) {

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
        .style("stroke", d => {
            /* If a letter */
            if (letrs.has(d.source.name[0])) {
                return sankeyColor(d.source.name[0])
            }
            return sankeyColor(gradeScale(d.source.name));
        })
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
            d3.selectAll(".axes").style("visibility", "visible");
        })
        .on("mouseout", () => {
            if (!isActive) {
                d3.selectAll(".lines").style("visibility", "hidden");
                d3.selectAll(".axes").style("visibility", "hidden");
            }
        });

}