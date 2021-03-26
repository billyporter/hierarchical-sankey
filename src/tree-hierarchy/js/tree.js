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
    drawTreeAxes(node, sankeyData);
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
function getTreeAxes(node){
    const assessment = node.assessment; // for use as axis label
    let assess = assessment; //for checking in assessGradeLevelMap
    if(assess.localeCompare("Final Exam") === 0){
        assess = " " + assess;
    } 

    const axes = [];
    axes.push(`${assessment} Level 0`);
    axes.push(`${assessment} Level 1`);

    const level = assessGradeLevelMap[assess][node.name[0]]["level"];
    if(level == 2){
        axes.push(`${assessment} Level 2`);
    }

    if(assessment.localeCompare("Final Exam") !== 0){
        let next_assess = assessments[assessments.indexOf(assess)+1];
        if(next_assess.localeCompare(" Final Exam") === 0){
            next_assess = "Final Exam"; 
        }  
        axes.push(`${next_assess}`);
    }
    return axes;
}

/**
 * Function to place axes on the tree plot
 */
function drawTreeAxes(node, sankeyData){
    const axes = getTreeAxes(node);

    const assessment = node.assessment; // for use as axis label
    let assess = assessment; //for checking in assessGradeLevelMap
    if(assess.localeCompare("Final Exam") === 0){
        assess = " " + assess;
    } 

    const level = assessGradeLevelMap[assess][node.name[0]]["level"];

    // get x coordinates for each axis 
    const xs = [];
    xs.push(sankeyData["nodes"][0]["x0"]);
    xs.push(sankeyData["nodes"][1]["x0"]);
    if(level == 2){ // factor percent case
        xs.push(sankeyData["nodes"][4]["x0"]);
    }
    last = sankeyData["nodes"].length;
    xs.push(sankeyData["nodes"][last-1]["x0"]);

    for([index, coord] of xs.entries()){
        treesvg.append("text")
        .attr("class", "axis-label")
        .attr("class", "tree")
        .attr("y", height + 25)
        .attr("x", 20 + coord)
        .style("text-anchor", "middle")
        .text(axes[index]);
    } 
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
            if(grade in output["grades"][assessment.trim()]){
                output["grades"][assessment.trim()][grade]["count"]++;
                output["grades"]["parent"]["count"]++;

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
                    let target = output["grades"][treeAssessments[index + 1].trim()][nextGrade]["id"]; // next grade id

                    for (const [index, link] of output["links"].entries()) {
                        if (JSON.stringify(link["source"]) == source && JSON.stringify(link["target"]) == target) {
                            output["links"][index]["value"]++;
                        }
                    }
                }
                // fill in parent links
                let parentTarget = output["grades"][assessment.trim()][grade]["id"];
                let parentSource = 0;
                for (const [index, link] of output["links"].entries()) {
                    if (JSON.stringify(link["source"]) == parentSource && JSON.stringify(link["target"]) == parentTarget) {
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

    let assessment = node.assessment.trim();
    const grade = node.name[0]; // stores the parent grade name
    if(assessment.localeCompare("Final Exam") === 0){
        assessment = " " + assessment;
    }
    const levels = assessGradeLevelMap[assessment][grade]; // breakdowns for the level of each part of the assessment
    const currLevel = levels["level"]; // overall level for the assessment

    dict[id++] = { [assessment]: grade}; //id for the parent node
    if (grade !== 'F') {
        if (grade !== 'A') {
            dict[id++] = { [assessment]: grade.concat("+") };
        }
        dict[id++] = { [assessment.trim()]: grade };
        dict[id++] = { [assessment.trim()]: grade.concat("-") };
    }
    else {
        dict[id++] = { [assessment.trim()]: "0-59" };
    }
    if(currLevel === 2) { // on percent case
        let subgrade = node.name[1];
        if(!subgrade){
            subgrade = "def";
        }
        /* Seen set so don't have repeat nodes, also memoize */
        const seen = new Set();

        /* numbersArray stores nodes that are filtered right */
        const numbersArray = []
        for (const student of Object.entries(rawData)) { // see which percentage grades that correspond to parent have entries
            if (!student[1][assessment]) {
                continue;
            }
            const currGrade = student[1][assessment];
            if (seen.has(currGrade)) { 
                continue;
            }
            seen.add(currGrade); // mark number grade as valid
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

    /* create ids for the following assessment */
    if(assessment.localeCompare(" Final Exam") !== 0){ 
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

    const assessment = node.assessment.trim();

    let count = -1;
    for([index, exam] of Object.entries(newIds)){ // get count of +/_/- nodes 
        let mark = Object.keys(exam)[0];
        let score = Object.values(exam)[0];
        if(assessment.localeCompare(mark) === 0 && isNaN(score)){
            count += 1;
        }
    }
    const firstCount = count;

    let firstParentId = 0;
    let secondParentId = 0;
    for(i = 1; i <= firstCount; i++){ // create +/_/- links
        links.push({ "source": firstParentId, "target": i, "value": 0 });
        if(newIds[i][assessment].localeCompare(node.name) === 0){
            secondParentId = i;
        }
    }


    // get count of percentage nodes 
    count = 0;
    const level = assessGradeLevelMap[assessment][node.name[0]]["level"];
    if(level == 2){
        percent = firstCount + 1;
        while(!isNaN(newIds[percent][assessment])){ // create numeral links
            links.push({ "source": secondParentId, "target": percent, "value": 0 })
            percent++;
            count ++;
        }
    }
    const secondCount = count;

    if(assessment.localeCompare("Final Exam") !== 0){ // fill in links to the following assessment
        if(level == 1){
            for(i = 1; i <= firstCount; i++){ 
                for(j = firstCount + 1; j < Object.entries(newIds).length; j++){ // just fill out +/_/- mapped to ABCDF
                    links.push({ "source": i, "target" : j, "value": 0 });
                }
            }
        } else {
            for(i = 1; i <= firstCount; i++){
                if(i !== secondParentId){
                    for(j = firstCount + 1; j < Object.entries(newIds).length; j++){ // map whichever of +/_/- are not the second parent to ABCDF
                        links.push({ "source": i, "target" : j, "value": 0 });
                    }
                } else { // map the numerals corresponding to the second parent to ABCDF on following assessment
                    for(k = firstCount+1; k<firstCount+1 + secondCount; k++){ //iterate over the integer ids
                        for(j = firstCount + secondCount + 1; j < Object.entries(newIds).length; j++){
                            links.push({ "source": k, "target" : j, "value": 0 });
                        } 
                    }
                }
            }
        }
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

    /* handle case of parent node because it is a duplicate key ie A -> A A-*/
    dict["parent"] = {
        "id": 0,
        "count": 0
    };
    return dict
}