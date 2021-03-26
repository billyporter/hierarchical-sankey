/**
 * Draw hierarchical tree sankey for node expansion
 */
function drawTreeSankey(node, sankeyData){

    treesvg.style("visibility", "visible");

    treesvg.append("text")
    .attr("class", "title")
    .attr("class", "tree")
    .attr("x", width / 2)
    .attr("y", -15)
    .style("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "600")
    .text("Expanded Tree");

    graph = sankey(sankeyData); 
    drawTreeNodes(graph);
    drawTreeLinks(graph);
}

/**
 * 
 * Function to draw nodes of sankey
 */
 function drawTreeNodes(graph) {
    /* Creates Node */
    var graphnode = treesvg
        .append("g")
        .classed("nodes", true)
        .selectAll("rect")
        .data(graph.nodes)
        .enter()

    /* Draws Node */
    graphnode.append("rect")
        .attr("class", "node")
        .attr("class", "tree")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => (d.x1 - d.x0))
        .attr("height", d => {
            d.rectHeight = d.y1 - d.y0;
            return (d.y1 - d.y0)
        })
        .style("fill", (d) => {
            return getNodeColor(d.name)
        })
        .attr("stroke", (d) => {
            return d3.rgb(getNodeColor(d.name)).darker(0.6);
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
        .text((d) => d.name + "\n" + " Students")


    /* Add in text */
    graphnode.append("text")
        .style("font-size", "16px")
        .attr("class", "nodeText")
        .attr("class", "tree")
        .attr("x", function (d) { return d.x0 - 30; })
        .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
        .attr("dy", "0.35em")
        .text(function (d) { return d.name; });

}

/**
 * 
 * Function to draw Links of Sankey
 */
var graphlink;
function drawTreeLinks(graph) {

    /* Creates Link */
    graphlink = treesvg
        .append("g")
        .attr("class", "links")
        .attr("class", "tree")
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
        .attr("y0", d => {
            d.y0;
        })
        .style("stroke", d => {
            return getNodeColor(d.source.name);
        })
}


/**
 * Function to create node and link data for expanded tree hierarchy sankey
 */
function formatTreeSankey(node) {
    newIds = createIDS();
    newLinks = createLinks(newIds);
    newNodes = createNodes(newIds);
    newGrades = createGrades(newIds);

    // console.log(newIds);
    // console.log(newLinks);
    // console.log(newNodes);
    // console.log(newGrades);
    // console.log(node);

    output = {
        "ids": newIds,
        "grades": newGrades,
        "nodes": newNodes,
        "links": newLinks
    }

    let assess = node.assessment;
    let treeAssessments = [assess, assessments[assessments.indexOf(assess)+1]];
    if(assess.localeCompare("Final Exam") === 0){
        assess = " " + assess;
        treeAssessments = [assess];
    }

    for (const student of Object.entries(rawData)) {
        for ([index, assessment] of treeAssessments.entries()) {
            if (!student[1][assessment]) {
                continue;
            }
            let grade = gradeScale(student[1][assessment]);
            let level = assessGradeLevelMap[assessment][grade]["level"];
            if (level === 1) {
                grade = specificLetterScale(grade, student[1][assessment]);
                if (grade.localeCompare('F') === 0) {
                    grade = "0-59";
                }
            }
            if (level === 2) {
                grade = specificLetterScale(grade, student[1][assessment]);
                if (grade.length === 1 && assessGradeLevelMap[assessment][grade]["def"] === 2) {
                    grade = student[1][assessment];
                }
                else if (assessGradeLevelMap[assessment][grade[0]][grade[grade.length - 1]] === 2) {
                    grade = student[1][assessment];
                }
            }
            output["grades"][assessment.trim()][grade]["count"]++;

            if (assess.localeCompare(" Final Exam") !== 0) {
                let nextGrade = gradeScale(student[1][treeAssessments[index + 1]]);
                let copyNextGrade = student[1][treeAssessments[index + 1]];
                if (nextGrade == "") {
                    continue;
                }
                let level = assessGradeLevelMap[treeAssessments[index + 1]][nextGrade]["level"];
                if (level === 1) {
                    nextGrade = specificLetterScale(nextGrade, student[1][treeAssessments[index + 1]]);
                    if (nextGrade.localeCompare('F') === 0) {
                        nextGrade = "0-59";
                    }
                }
                if (level === 2) {
                    nextGrade = specificLetterScale(nextGrade, student[1][treeAssessments[index + 1]]);
                    if (nextGrade.length === 1 && assessGradeLevelMap[treeAssessments[index + 1]][nextGrade]["def"] === 2) {
                        nextGrade = copyNextGrade;
                    }
                    else if (assessGradeLevelMap[treeAssessments[index + 1]][nextGrade[0]][nextGrade[nextGrade.length - 1]] === 2) {
                        nextGrade = copyNextGrade;
                    }
                }
                let source = output["grades"][assessment.trim()][grade]["id"]; // prev grade id
                let target = output["grades"][treeAssessments[index + 1].trim()]
                [nextGrade]["id"]; // next grade id

                for (const [index, link] of output["links"].entries()) {
                    if (JSON.stringify(link["source"]) == source && JSON.stringify(link["target"]) == target) {
                        output["links"][index]["value"]++;
                    }
                }
            }
        }
    }
    console.log(output);
    return output;
}


/**
 * Function for reset button to remove tree plot elements
 */
 function removeTreePlots() {
    d3.selectAll(".tree").remove();
}