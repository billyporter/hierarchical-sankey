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
    const treeAxes = getTreeAxes(node, graph);
    // console.log(treeAxes);
    // console.log(graph);
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
 * Function to determine which axes should be used for the hiearchy tree
 */
function getTreeAxes(node, graph){
    const assessment = node.assessment; // for use as axis label
    const assess = assessment; //for checking in assessGradeLevelMap
    if(assess.localeCompare("Final Exam") === 0){
        assess = " " + assess;
    } 

    const axes = [];
    axes.push(`${assessment} Level 1`)

    const level = assessGradeLevelMap[assess][node.name]["level"];
    if(level == 2){
        axes.push(`${assessment} Level 2`)
    }

    let next_assess = assessments[assessments.indexOf(assess)+1];
    if(next_assess.localeCompare(" Final Exam") === 0){
       next_assess = "Final Exam"; 
    }  
    axes.push(`${next_assess}`);
    return axes;
}

/**
 * Function to create node and link data for expanded tree hierarchy sankey
 */
function formatTreeSankey(node) {

    let assess = node.assessment;
    let treeAssessments = [assess, assessments[assessments.indexOf(assess)+1]];
    if(assess.localeCompare("Final Exam") === 0){
        assess = " " + assess;
        treeAssessments = [assess];
    }

    newIds = createTreeIDS(node);
    newLinks = createTreeLinks(newIds, node);
    newNodes = createTreeNodes(newIds, node);
    newGrades = createTreeGrades(newIds, node);

    output = {
        "ids": newIds,
        "grades": newGrades,
        "nodes": newNodes,
        "links": newLinks
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
    // console.log(output);
    return output;
}


/**
 * Function for reset button to remove tree plot elements
 */
 function removeTreePlots() {
    d3.selectAll(".tree").remove();
}

/**
 * Function to create the base of the sankey data based on the node that was clicked
 */
function createTreeIDS(node) {
    let id = 0;
    dict = {} // dict to hold ids

    const assessment = node.assessment.trim();
    dict[id++] = { [assessment]: node.name[0]};
    const grade = node.name[0]; // stores the parent grade name
    const levels = assessGradeLevelMap[assessment][grade]; // breakdowns for the level of each part of the assessment
    const currLevel = levels["level"]; // overall level for the assessment

    if(currLevel == 1){ // on +/_/- case
        if (grade !== 'F') {
            if (grade !== 'A') {
                dict[id++] = { [assessment]: node.name.concat("+") };
            }
            dict[id++] = { [assessment.trim()]: node.name };
            dict[id++] = { [assessment.trim()]: node.name.concat("-") };
        }
        else {
            dict[id++] = { [assessment.trim()]: "0-59" };
        }
    } else { // on percent case
        for (const subgrade of ["+", "def", "-"]) {
            /* Seen set so don't have repeat nodes, also memoize */
            const seen = new Set();

            /* numbersArray stores nodes that are filtered right */
            const numbersArray = []
            for (const student of Object.entries(rawData)) {
                if (!student[1][assessment]) {
                    continue;
                }
                const currGrade = student[1][assessment];
                if (seen.has(currGrade)) {
                    continue;
                }
                seen.add(currGrade);
                currGradeLevel = specificLetterScale(gradeScale(currGrade), currGrade);
                let suffix = subgrade;
                if (suffix.localeCompare("def") === 0) {
                    suffix = "";
                }
                if (currGradeLevel === grade.concat(suffix)) {
                    numbersArray.push(currGrade);
                }
            }
            for (const num of numbersArray.sort(function (a, b) { return parseInt(b) - parseInt(a) })) {
                dict[id++] = { [assessment.trim()]: num };
            }
        }
    }

    /* create ids for the following assessment */
    if(assessment.localeCompare("Final Exam") !== 0){ 
        const nextAssessment = assessments[assessments.indexOf(assessment)+1];
        for([index, mark] of grades.entries()){
            dict[id++] = { [nextAssessment.trim()]: mark};
        }
    }

    return dict;
}

/**
 * [
 *      {source: current_index, target: target_index, value: 0}
 * ]
 * 
 * formatTreeSankey updates values
 * 
 */
function createTreeLinks(newIds, node) {

    links = [];
    let prevTop = 0; // top of previous column
    for (column = 0; column < assessments.length - 1; column++) {
        let firstColLength = 0;
        let secColLength = 0;

        /* Count length of columns based on expansion */
        for (const [key, value] of Object.entries(newIds)) {
            if (assessments[column] === Object.keys(value)[0]) {
                firstColLength += 1;
            }
            if (assessments[column + 1].trim() === Object.keys(value)[0]) {
                secColLength += 1;
            }
        }
        for (let first = 0; first < firstColLength; first++) {
            const currPosition = prevTop + first;
            for (second = 0; second < secColLength; second++) {
                const targPosition = prevTop + firstColLength + second;
                links.push({ "source": currPosition, "target": targPosition, "value": 0 });
            }
        }
        prevTop += firstColLength;
    }
    return links;
}


/**
 * [ {id: 0}, {id: 1}, ...]
 */
function createTreeNodes(newIds, node) {
    nodes = []
    for (const [key, value] of Object.entries(newIds)) {
        nodes.push({
            "id": parseInt(key),
            "name": Object.values(value)[0],
            "assessment": Object.keys(value)[0],
        });
    }
    return nodes
}


/**
 *  [
 *      {Exam 1: 
 *          {A: {id: 0, count: 756}}},
 *          {B: {id: 0, count: 555}}},
 *          ...
 *      {Exam 2: 
 *          {A: {id: 0, count: 756}}},
 *          {B: {id: 0, count: 555}}},
 *          ...
 *  ]
 * 
 * */
function createTreeGrades(newIds, node) {
    dict = {};
    for (const [key, value] of Object.entries(newIds)) {
        if (!dict[Object.keys(value)[0].trim()]) {
            dict[Object.keys(value)[0].trim()] = {}
        }
        dict[Object.keys(value)[0].trim()][Object.values(value)[0]] = {
            "id": parseInt(key),
            "count": 0
        }
    }
    return dict
}