
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
function drawSankey(sankeyData, isFirst, isBreakdown, oldData, brokeExam, brokeGrade) {
    /* Check for padding issues */
    setNewPadding(sankeyData);

    /* Keep copy of old graph for animation purposes */
    if (oldData) {
        oldGraph = sankey(oldData);
    }
    graph = sankey(sankeyData);

    /* If on load, add all points */
    if (isFirst) {
        populatePointStorageObj(graph);
        populateLinkStorageObj(graph);
        drawNodes(graph);
        drawLinks(graph);
    }

    /* Store new points and new links*/
    storeNewPoints(graph);
    storeNewLinks(graph);

    /* Get necessary objects */
    newPointsNotInOldSet = newNotInOld();
    oldPointsNotInNewSet = oldNotInNew();
    [oldLinkSet, oldLinksObj] = oldLinkNotinNewSet(brokeExam, brokeGrade);
    [newLinkSet, newLinksObj] = newLinkNotinOldSet(brokeExam, brokeGrade, isBreakdown);


    /**
     * Transition Updating
    */

    /* For case of breaking down */
    if (isBreakdown) {

        /* Set node values to old graph point to begin animation */
        for (const node of graph.nodes) {
            let visualNode;
            /* If node is a new node not in the old set, then it should be set to the value
               of the only node that is in the old set but not the new set */
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
        /* Set link value to old graph point to begin animation */
        for (const link of graph.links) {
            let visualLink;

            /* Broke Node : Node corresponding to broke exam */
            let brokeNode = brokeExam.trim().localeCompare(link.source.assessment) === 0 ? link.source.name : link.target.name;
            let cleanNode = brokeExam.trim().localeCompare(link.target.assessment) === 0 ? link.source.name : link.target.name;
            if (newLinkSet.has(
                [link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                    .toString()
            )
            ) {
                /* When breaking down, we want to set the multiple new links that form, 
                * all to the point of the original
                * node 
                */
                /* We don't want all the links on all the nodes, just the specific letter one */
                if (cleanNode.localeCompare(link.source.name) === 0 && cleanNode[0].localeCompare(brokeNode[1]) !== 0) {
                    visualLink = link;
                }
                else {
                    const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                    const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                    visualLink = oldLinksObj[direction][gradeToInput];
                }
            }
            else {
                visualLink = oldLinks[link.source.assessment][link.source.name][link.target.assessment][link.target.name];
            }
            link.y0 = visualLink.y0;
            link.y1 = visualLink.y1;
            link.width = visualLink.width;
        }
        /* First draw nodes and draw links according to these old values */
        drawNodes(graph);
        drawLinks(graph);

        /* Animate to the new values */
        transitionToNewBreakdown(sankeyData, newPointsNotInOldSet, oldPointsNotInNewSet, newLinkSet, brokeExam);
    }
    else if (!isFirst) {
        /* Handles case of building up */
        drawNodes(oldGraph);
        drawLinks(oldGraph);
        transitionToNewBuildup(newPointsNotInOldSet, oldPointsNotInNewSet, oldLinkSet, newLinkSet, newLinksObj, sankeyData, brokeExam);
    }

    /* Store new points in old points */
    oldGraphPoints = JSON.parse(JSON.stringify(newGraphPoints));
    oldLinks = JSON.parse(JSON.stringify(newLinks));
    oldLinksMap = new Map(newLinksMap);
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
            d.preventDefault();
            hierarchSankeyRouter(i, false);
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
            return sankeyColor(d.source.name[0]);
        });
}

/**
 * Function to animate the transition from breaking down a node
 * 
 * @param {*} sankeyData --> Sankey Data
 * @param {*} newPointsNotInOldSet --> New nodes not in old set (ex. A+)
 * @param {*} oldPointsNotInNewSet --> Old nodes not in new set (ex. A [when breaking down A -> A, A+])
 * @param {*} newLinkSet --> new links not in old link set (ex. A+-B)
 * @param {*} brokeExam --> The exam being broken down
 */
function transitionToNewBreakdown(sankeyData, newPointsNotInOldSet, oldPointsNotInNewSet, newLinkSet, brokeExam) {

    /**
     * Setup for nodes and links pre transition
     */

    /**
     * When we overlay multitple links on top of each other, it becomes a very dark link,
     * so we set opacity to 0 for all but one of the starting links (as when breaking a node down,
     * all the new links start on the old link)
     */
    const seen = {}
    seen['left'] = {}
    seen['right'] = {}
    graphlink
        .style("stroke-opacity", function (link) {
            if (newLinkSet.has(
                [link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                    .toString()
            )
            ) {
                let brokeNode = brokeExam.trim().localeCompare(link.source.assessment) === 0 ? link.source.name : link.target.name;
                let cleanNode = brokeExam.trim().localeCompare(link.target.assessment) === 0 ? link.source.name : link.target.name;
                if (cleanNode.localeCompare(link.source.name) === 0 && cleanNode[0].localeCompare(brokeNode[1]) !== 0) {
                    return 0.4
                }
                const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                if (gradeToInput in seen[direction]) {
                    return 0.0;
                }
                else {
                    seen[direction][gradeToInput] = true;
                }
            }
            return 0.4;
        })

    /**
     * Animate Nodes
     */
    d3.selectAll('.node').each(function (d) {
        d3.select(this)
            .transition().ease(d3.easeCubic).duration(transitionDuration)
            .attr('y', function (n) {
                n.y0 = newGraphPoints[n.assessment][n.name]["y0"];
                n.y1 = newGraphPoints[n.assessment][n.name]["y1"];
                n.rectHeight = n.y1 - n.y0;
                return n.y0;
            })
            .attr('height', function (n) {
                return n.rectHeight;
            });
    });
    d3.selectAll('.nodeText').each(function (d) {
        d3.select(this)
            .transition().ease(d3.easeCubic).duration(transitionDuration)
            .attr('y', function (n) {
                return (n.y0 + n.y1) / 2;
            });
    });

    /**
     * Animate links
     */

    /* Set new link location */
    for (const link of graph.links) {
        let visualNode = newLinks[link.source.assessment][link.source.name][link.target.assessment][link.target.name];
        link.y0 = visualNode.y0;
        link.y1 = visualNode.y1;
        link.width = visualNode.width;
    }

    /* sofar and total control when to draw the new graph */
    let soFar = 0;
    const total = graphlink["_groups"][0].length;

    /* Animate link */
    graphlink
        .transition()
        .ease(d3.easeCubic)
        .duration(transitionDuration)
        .attr('d', d3.sankeyLinkHorizontal())
        .style("stroke-opacity", 0.4)
        .style("stroke-width", function (n) {
            return n.width;
        })
        .on("end", function () {
            soFar += 1;
            if (soFar === total) {
                removePlots();
                drawNodes(graph);
                drawLinks(graph);
            }
        });
}

/**
 * Function that animates transition when building up a node
 * 
 * @param {*} newPointsNotInOldSet --> New Nodes not in old Graph (ex. build up A+/A/A-, new node is A)
 * @param {*} oldPointsNotInNewSet --> Old Nodes not in new graph (ex., old is A+/A/A-)
 * @param {*} oldLinkSet --> Same but for links
 * @param {*} newLinkSet --> Same but for links
 * @param {*} newLinksObj --> new link set but in a different structure
 * @param {*} sankeyData --> sankey data
 * @param {*} brokeExam 
 */
function transitionToNewBuildup(newPointsNotInOldSet, oldPointsNotInNewSet, oldLinkSet, newLinkSet, newLinksObj, sankeyData, brokeExam) {

    /**
     * Animate nodes
     */
    d3.selectAll('.node').each(function (d) {
        d3.select(this)
            .transition()
            .duration(transitionDuration)
            .attr('y', function (n) {
                /* Set node to new point */
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
            .attr('height', function (n) { // Node size
                return n.rectHeight;
            });
    });

    /* Animate node text */
    d3.selectAll('.nodeText').each(function (d) {
        d3.select(this)
            .transition()
            .duration(transitionDuration)
            .attr('y', function (n) {
                return (n.y0 + n.y1) / 2;
            });
    });

    /* Set links to new position */
    for (const link of oldGraph.links) {
        let visualLink;
        let brokeNode = brokeExam.trim().localeCompare(link.source.assessment) === 0 ? link.source.name : link.target.name;
        let cleanNode = brokeExam.trim().localeCompare(link.target.assessment) === 0 ? link.source.name : link.target.name;
        if (oldLinkSet.has([link.source.assessment, link.source.name, link.target.assessment, link.target.name]
            .toString()
        )
        ) {
            if (cleanNode.localeCompare(link.source.name) === 0 && cleanNode[0].localeCompare(brokeNode[1]) !== 0) {
                visualLink = link;
            }
            else {
                const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                visualLink = newLinksObj[direction][gradeToInput]
            }
        }
        else {
            visualLink = newLinks[link.source.assessment][link.source.name][link.target.assessment][link.target.name];
        }
        link.y0 = visualLink.y0;
        link.y1 = visualLink.y1;
        link.width = visualLink.width;
    }
    let soFar = 0;
    let total = graphlink["_groups"][0].length;
    const seen = {}
    seen['left'] = {}
    seen['right'] = {}
    graphlink
        .transition()
        .duration(transitionDuration)
        .attr('d', d3.sankeyLinkHorizontal()).style("stroke-width", function (n) {
            return n.width;
        }).style("stroke-opacity", function (link) {
            if (oldLinkSet.has([link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                .toString()
            )) {
                let brokeNode = brokeExam.trim().localeCompare(link.source.assessment) === 0 ? link.source.name : link.target.name;
                let cleanNode = brokeExam.trim().localeCompare(link.target.assessment) === 0 ? link.source.name : link.target.name;
                if (cleanNode.localeCompare(link.source.name) === 0 && cleanNode[0].localeCompare(brokeNode[1]) !== 0) {
                    return 0.4
                }
                const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                if (gradeToInput in seen[direction]) {
                    return 0.0;
                }
                else {
                    seen[direction][gradeToInput] = true;
                }
            }
            return 0.4;
        }).on("end", function () {
            soFar += 1;
            if (soFar === total) {
                removePlots();
                drawNodes(graph);
                drawLinks(graph);
            }
        });
}
