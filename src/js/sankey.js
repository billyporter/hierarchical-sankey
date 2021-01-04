
/**
 * 
 * Nodes Section
 * 
 */


var oldGraphPoints = {};
var newGraphPoints = {};



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
var graph;
var oldGraph;
function drawSankey(sankeyData, isFirst, isBreakdown, oldData) {

    /* Fomats Sankey */
    if (oldData) {
        oldGraph = sankey(oldData);
    }
    graph = sankey(sankeyData);

    /* If first time, add all points */
    if (isFirst) {
        populatePointStorageObj(graph);

        drawNodes(graph);
        drawPC(sankeyData);
        drawLinks(graph);
    }


    /* Store new point in NGP */
    storeNewPoints(graph);

    /* Get necessary objects */
    newPointsNotInOldSet = newNotInOld();
    oldPointsNotInNewSet = oldNotInNew();

    /**
     * Transition Updating
    */

    /* For case of breaking down */
    if (isBreakdown) {
        for (const node of graph.nodes) {
            let visualNode;
            if (newPointsNotInOldSet.has([node.assessment, node.name, node.value].toString())) {
                const searchNode = oldPointsNotInNewSet.keys().next().value.split(',');
                visualNode = oldGraphPoints[searchNode[0]][searchNode[1]];
            }
            else {
                visualNode = oldGraphPoints[node.assessment][node.name];
            }
            node.y0 = visualNode.y0;
            node.y1 = visualNode.y1;
        }
        drawNodes(graph);
        drawPC(sankeyData);
        drawLinks(graph);
        transitionToNewBreakdown();
        d3.selectAll(".link").remove();
        drawPC(sankeyData);
        drawLinks(graph);
    }
    else if (!isFirst) { // Handle case of building up
        console.log('here');
        drawNodes(oldGraph);
        drawLinks(oldGraph);
        transitionToNewBuildup(newPointsNotInOldSet, oldPointsNotInNewSet, sankeyData);
    }


    /* Store new points in old points */
    oldGraphPoints = JSON.parse(JSON.stringify(newGraphPoints));
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
            /* case for whole letter grade nodes */
            if (letrs.has(d.name))
                return d3.rgb(sankeyColor(d.name)).darker(0.6);
            /* case for + and - grade nodes */
            if (letrs.has(d.name[0]))
                return d3.rgb(getShadePlusMinus(sankeyColor(d.name[0]), d.name[1])).darker(0.6);
            /* case for number grade nodes */
            return d3.rgb(getShadeNumber(sankeyColor(gradeScale(d.name)), d.name)).darker(0.6);
        })
        .on("click", function (d, i) {
            hierarchSankeyRouter(i, true);
        })
        .on("contextmenu", function (d, i) {
            d.preventDefault();
            hierarchSankeyRouter(i, false);
        });


    /* Add in title */
    graphnode.append("title")
        .text((d) => d.name + "\n" + " Students");


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
    graphlink
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("fill", "none")
        .style("stroke-width", d => d.width)
        .style("stroke", d => {
            /* case for whole letter grade nodes */
            if (letrs.has(d.source.name))
                return sankeyColor(d.source.name);

            /* case for + and - grade nodes */
            if (letrs.has(d.source.name[0]))
                return getShadePlusMinus(sankeyColor(d.source.name[0]), d.source.name[1]);

            /* case for number grade nodes */
            return getShadeNumber(sankeyColor(gradeScale(d.source.name)), d.source.name);
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

function transitionToNewBreakdown(d) {
    d3.selectAll('.node').each(function (d) {
        d3.select(this)
            .transition()
            .attr('y', function (n) {
                n.y0 = newGraphPoints[n.assessment][n.name]["y0"];
                n.y1 = newGraphPoints[n.assessment][n.name]["y1"];
                n.rectHeight = n.y1 - n.y0;
                return n.y0;
            })
            .attr('height', function (n) {
                return n.rectHeight;
            })
    });
    d3.selectAll('.nodeText').each(function (d) {
        d3.select(this)
            .transition()
            .attr('y', function (n) {
                return (n.y0 + n.y1) / 2;
            });
    });

    sankey.update(graph);
    graphlink.transition().attr('d', d3.sankeyLinkHorizontal());
    d3.selectAll(".axes").remove();
    d3.selectAll(".lines").remove();
}

function transitionToNewBuildup(newPointsNotInOldSet, oldPointsNotInNewSet, sankeyData) {
    d3.selectAll('.node').each(function (d) {
        d3.select(this)
            .transition()
            .attr('y', function (n) {
                let visualNode;
                if (oldPointsNotInNewSet.has([n.assessment, n.name, n.value].toString())) {
                    const searchNode = newPointsNotInOldSet.keys().next().value.split(',');
                    visualNode = newGraphPoints[searchNode[0]][searchNode[1]];
                }
                else {
                    visualNode = newGraphPoints[n.assessment][n.name]
                }
                n.y0 = visualNode.y0;
                n.y1 = visualNode.y1;
                n.rectHeight = n.y1 - n.y0;
                return n.y0;
            })
            .attr('height', function (n) {
                return n.rectHeight;
            })
    });
    d3.selectAll('.nodeText').each(function (d) {
        console.log('here');
        d3.select(this)
            .transition()
            .attr('y', function (n) {
                return (n.y0 + n.y1) / 2;
            });
    });

    sankey.update(oldGraph);
    let soFar = 0;
    let total = graphlink["_groups"][0].length;
    graphlink.transition().attr('d', d3.sankeyLinkHorizontal()).on("end", function () {
        soFar += 1;
        if (soFar === total) {
            removePlots();
            drawNodes(graph);
            drawPC(sankeyData);
            drawLinks(graph);
        }
    });
    d3.selectAll(".axes").remove();
    d3.selectAll(".lines").remove();
}