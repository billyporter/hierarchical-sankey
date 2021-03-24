
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
function drawSankey(sankeyData, isFirst, isBreakdown, oldData, brokeExam, brokeGrade) {
    /* Keep copy of old graph for animation purposes */
    if (oldData) {
        oldGraph = sankey(oldData);
    }


    graph = sankey(sankeyData);


    if (isFirst) {
        populateLinkStorageObj(graph);
        drawNodes(graph);
        drawLinks(graph);
    }

    /* Store new points and new links*/
    storeNewLinks(graph);


    [oldLinkSet, oldLinksObj] = oldLinkNotinNewSet(brokeExam, brokeGrade);
    [newLinkSet, newLinksObj] = newLinkNotinOldSet(brokeExam, brokeGrade, isBreakdown);

    if (isBreakdown) {
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
        drawNodes(graph,);
        drawLinks(graph, newLinkSet, brokeExam, brokeGrade, isBreakdown);

        /* Animate to the new values */
        transitionToNewBreakdown();
    }
    else if (!isFirst) {
        drawNodes(graph);
        drawLinks(oldGraph, newLinkSet, brokeExam, brokeGrade, isBreakdown);
        transitionToNewBuildup(oldLinkSet, newLinkSet, newLinksObj, brokeExam, brokeGrade)
    }
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
            if (assessGradeLevelMap[i['assessment']][i['name'][0]] === 0) {
                hierarchSankeyRouter(i, true);
            }
        })
        .on("mouseover", function (i, d) {
            d3.selectAll(".link").style("stroke-opacity", function (link) {
                const dIndex = assessments.indexOf(d.assessment);
                const aIndex = assessments.indexOf(link.source.assessment);
                if (link.source.name === d.name && link.source.assessment === d.assessment) {
                    return 0.9;
                }
                else if (assessGradeLevelMap[link.source.assessment.trim()][link.source.name] === 1
                    && dIndex < aIndex
                    && (aIndex - dIndex === 1 || assessGradeLevelMap[assessments[aIndex - 1]][d.name] === 1)
                    && (link.sourceName === d.name)) {
                    return 0.9;
                }
                else {
                    return 0.4;
                }
            });
        })
        .on("mouseout", () => {
            d3.selectAll(".link").style("stroke-opacity", function (link) {
                return 0.4;
            });
        })
        .on("contextmenu", function (d, i) {
            d.preventDefault();
            if (assessGradeLevelMap[i['assessment']][i['name'][0]] === 1) {
                hierarchSankeyRouter(i, false);
            }
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
function drawLinks(graph, newLinkSet, brokeExam, brokeGrade, isBreakdown) {

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
        .attr("stop-opacity", 0.5)
        .style("stroke-width", d => d.width)
        .style("stroke", d => {
            const key = `${d.source.assessment},${d.source.name},${d.target.assessment},${d.target.name}`;
            if (newLinkSet && newLinkSet.has(key) && d.source.assessment === brokeExam && d.source.name === brokeGrade) {
                if (isBreakdown) {
                    return sankeyColor(d.source.name[0]);
                }
                return sankeyColor(d.sourceName);
            }
            else if (newLinkSet && d.sourceName) {
                return sankeyColor(d.sourceName);
            }
            return sankeyColor(d.source.name[0]);
        });
}

/**
 * Function to animate the transition from breaking down a node
 */
function transitionToNewBreakdown() {

    /* Animate link */
    graphlink
        .transition()
        .ease(d3.easeCubic)
        .duration(transitionDuration + 500)
        .style("stroke", function (d) {
            if (d.sourceName) {
                return sankeyColor(d.sourceName);
            }
            return sankeyColor(d.source.name[0]);
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
function transitionToNewBuildup(oldLinkSet, newLinkSet, newLinksObj, brokeExam, brokeGrade) {

    let soFar = 0;
    let total = graphlink["_groups"][0].length;
    /* Draws Link */
    graphlink
        .transition()
        .ease(d3.easeCubic)
        .duration(transitionDuration + 500)
        .style("stroke", d => {
            const key = `${d.source.assessment},${d.source.name},${d.target.assessment},${d.target.name}`;
            if (newLinkSet && newLinkSet.has(key) && d.source.assessment === brokeExam && d.source.name === brokeGrade) {
                return sankeyColor(d.source.name[0]);
            }
            else if (newLinkSet && d.sourceName) {
                return sankeyColor(d.sourceName);
            }
            return sankeyColor(d.source.name[0]);
        }).on("end", function () {
            soFar += 1;
            if (soFar === total) {
                removePlots();
                drawNodes(graph);
                drawLinks(graph, newLinkSet);
            }
        });
}
