

/* Constants */
const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];
const grades = ["A", "B", "C", "D", "F"];

const letrs = new Set(["A", "B", "C", "D", "F"]);
const margin = { top: 10, right: 10, bottom: 10, left: 10 }
const svgBackground = "#eff";
const svgBorder = "1px solid #333";
let padding = 40;
const nodeWdt = 36;
const deflineColor = "#90A4AE";
let isActive = false;
let activeLink = -1;
const gradeCountDict = {};
const sankeyColor = d3.scaleOrdinal()
    .domain(['A', 'B', 'C', 'D', 'F'])
    .range(['#00ABA5', '#00A231', '#e2d000', '#E69200', '#DA1D02']);
const assessGradeLevelMap = {};

/* converts from hex color code to rgb color code struct */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/* converts from rgb color code struct to hex color code */
function rgbToHex(rgb) {
    hex = rgb.r.toString(16);
    r = hex.length == 1 ? "0" + hex : hex;
    hex = rgb.g.toString(16);
    g = hex.length == 1 ? "0" + hex : hex;
    hex = rgb.b.toString(16);
    b = hex.length == 1 ? "0" + hex : hex;
    return "#" + r + g + b;
}

/* Gets color shade for + and - grades */
function getShadePlusMinus(baseColor, sign) {
    color = hexToRgb(baseColor);

    if (sign == '-') {
        // 1/3 shade darker, maximum rgb value of 255
        color.r = color.r * 2 / 3 < 255 ? parseInt(color.r * 2 / 3) : 255;
        color.g = color.g * 2 / 3 < 255 ? parseInt(color.g * 2 / 3) : 255;
        color.b = color.b * 2 / 3 < 255 ? parseInt(color.b * 2 / 3) : 255;
    } else if (sign == '+') {
        // 1/3 shade brighter
        color.r = color.r * 4 / 3 < 255 ? parseInt(color.r * 4 / 3) : 255;
        color.g = color.g * 4 / 3 < 255 ? parseInt(color.g * 4 / 3) : 255;
        color.b = color.b * 4 / 3 < 255 ? parseInt(color.b * 4 / 3) : 255;
    } else { // there is a bug if this case is reached
        return baseColor;
    }

    return rgbToHex(color);
}

/* Gets color shade for number grades */
function getShadeNumber(baseColor, name) {
    color = hexToRgb(baseColor);

    //special case for 100
    if (name == "100") {
        color.r = color.r * (1 + 1 / 2) < 255 ? parseInt(color.r * (1 + 1 / 2)) : 255;
        color.g = color.g * (1 + 1 / 2) < 255 ? parseInt(color.g * (1 + 1 / 2)) : 255;
        color.b = color.b * (1 + 1 / 2) < 255 ? parseInt(color.b * (1 + 1 / 2)) : 255;
        return rgbToHex(color);
    }

    n = parseInt(name[1]); //examine the 1's column of the node name to determine shade

    if (n == 5) // middle will take base color 
        return baseColor;

    // 1's place 0-4 (darker)
    for (i = 0; i < 5; i++) {
        if (n == i) {
            color.r = color.r * 1 / 2 * (1 + i / 5) < 255 ? parseInt(color.r * 1 / 2 * (1 + i / 5)) : 255;
            color.g = color.g * 1 / 2 * (1 + i / 5) < 255 ? parseInt(color.g * 1 / 2 * (1 + i / 5)) : 255;
            color.b = color.b * 1 / 2 * (1 + i / 5) < 255 ? parseInt(color.b * 1 / 2 * (1 + i / 5)) : 255;
            return rgbToHex(color);
        }
    }

    // 1's place 6-9 (brighter)
    for (i = 6; i < 10; i++) {
        if (n == i) {
            color.r = color.r * (1 + 1 / 2 * (i - 5) / 5) < 255 ? parseInt(color.r * (1 + 1 / 2 * (i - 5) / 5)) : 255;
            color.g = color.g * (1 + 1 / 2 * (i - 5) / 5) < 255 ? parseInt(color.g * (1 + 1 / 2 * (i - 5) / 5)) : 255;
            color.b = color.b * (1 + 1 / 2 * (i - 5) / 5) < 255 ? parseInt(color.b * (1 + 1 / 2 * (i - 5) / 5)) : 255;
            return rgbToHex(color);
        }
    }

    // bug if this case is reached
    return baseColor;
}

/* Returns corresponding letter grade */
function gradeScale(score) {
    if (!score) {
        return "";
    }
    if (score >= 90) {
        return "A";
    } else if (score >= 80) {
        return "B";
    } else if (score >= 70) {
        return "C";
    } else if (score >= 60) {
        return "D";
    } else {
        return "F";
    }
}

/**
 * Populates grade level map
 * i.e. 
 * 0: A
 * 1: A, A-
 * 2: 90, 91, ..., 100
 */
function populateGradeLevelMap() {
    let id = 0;
    for ([index, assessment] of assessments.entries()) {
        assessGradeLevelMap[assessment.trim()] = {};
        for ([jndex, grade] of grades.entries()) {
            assessGradeLevelMap[assessment.trim()][grade] = 0;
        }
    }
}



/** Object:
 *  [
 *      {0: {Exam 1: "A"}},
 *      {1: {Exam 1: "B"}},
 *      {2: {Exam 1: "C"}},
 *      ...
 *      {4: {Exam 1: "F"}},
 *      {5: {Exam 2: "A"}},
 *  ]
 * 
 * */
function createIDS() {
    let id = 0;
    dict = {} // dict to hold ids
    for (const [index, assessment] of assessments.entries()) {
        for ([jndex, grade] of grades.entries()) {
            const currLevel = assessGradeLevelMap[assessment.trim()][grade];
            if (currLevel === 1) {
                const seen = new Set();
                for (const student of Object.entries(rawData)) {
                    if (!student[1][assessments[index]] || !student[1][assessments[index - 1]]) {
                        continue;
                    }
                    const currGrade = gradeScale(student[1][assessments[index]]);
                    const prevGrade = gradeScale(student[1][assessments[index - 1]]);
                    if (currGrade.localeCompare(grade) === 0) {
                        seen.add(prevGrade);
                    }
                }
                const gradesArray = Array.from(seen);
                gradesArray.sort();
                for (const gr of gradesArray) {
                    dict[id++] = { [assessment.trim()]: grade + gr };
                }
            }
            else {
                dict[id++] = { [assessment.trim()]: grade };
            }
        }
    }
    return dict;
}

/**
 * [
 *      {source: current_index, target: target_index, value: 0}
 * ]
 * 
 * formatSankeyData updates values
 * 
 */
function createLinks(newIds) {

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
function createNodes(newIds) {
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
function createGrades(newIds) {
    dict = {};
    for (const [key, value] of Object.entries(newIds)) {
        if (!dict[Object.keys(value)[0].trim()]) {
            dict[Object.keys(value)[0].trim()] = {}
        }
        const currExam = Object.keys(value)[0].trim()
        const currGrade = Object.values(value)[0]
        dict[currExam][currGrade] = {
            "id": parseInt(key),
            "count": 0
        }
    }
    return dict
}

/**
 * Function that updates values of the links
 * and combines each function into one ouput
 * object
 */
function formatSankey() {
    newIds = createIDS();
    newLinks = createLinks(newIds);
    newNodes = createNodes(newIds);
    newGrades = createGrades(newIds);

    output = {
        "ids": newIds,
        "grades": newGrades,
        "nodes": newNodes,
        "links": newLinks
    }
    for (const student of Object.entries(rawData)) {
        for ([index, assessment] of assessments.entries()) {
            if (!student[1][assessment]) {
                continue;
            }
            let grade = gradeScale(student[1][assessment]);
            let sourceNodeName = grade;
            let sourceLevel = assessGradeLevelMap[assessment.trim()][grade];
            if (sourceLevel === 1) {
                let previousGrade = gradeScale(student[1][assessments[index - 1]]);
                sourceNodeName = grade + previousGrade;
            }
            output["grades"][assessment.trim()][sourceNodeName]["count"]++;

            if (index < 3) {
                let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                if (nextGrade == "") {
                    continue;
                }
                let targetLevel = assessGradeLevelMap[assessments[index + 1].trim()][nextGrade];
                let targetNodeName = nextGrade
                if (targetLevel === 1) {
                    targetNodeName = nextGrade + grade;
                }

                let source = output["grades"][assessment.trim()][sourceNodeName]["id"]; // prev grade id
                let target = output["grades"][assessments[index + 1].trim()]
                [targetNodeName]["id"]; // next grade id

                for (const [index, link] of output["links"].entries()) {
                    if (JSON.stringify(link["source"]) == source && JSON.stringify(link["target"]) == target) {
                        output["links"][index]["value"]++;
                    }
                }
            }
        }
    }
    return output;
}



/**
 * 
 * 
 * 
 * History Node
 * Exploratory Section
 * 
 * 
 * 
 */


/**
 * Routes from click behavior to create new data
 * and updates level of clicked node
 * flag = true = breakdown
 * flag = false = build up
 */
function hierarchSankeyRouter(node, flag) {
    const oldGraph = formatSankey();

    /* Update Ids */
    const locAs = node['assessment'];
    const locGrade = node['name'][0];

    if (locAs.localeCompare('Exam 1') !== 0) {
        if (flag) {
            assessGradeLevelMap[locAs][locGrade] = 1
        }
        else {
            assessGradeLevelMap[locAs][locGrade] = 0
        }
        const newSankey = formatSankey();
        removePlots();
        /* Need to add space if final exam */
        let stringToInput = locAs;
        if (locAs.localeCompare('Final Exam') === 0)
            stringToInput = ' '.concat(locAs);
        drawSankey(newSankey, false, flag, oldGraph, stringToInput, locGrade)
    }
}

/**
 * Function to remove svg
 */
function removePlots() {
    d3.selectAll(".nodes").remove();
    d3.selectAll(".link").remove();
}

/**
 * Function to variable set correct padding
 * based on number of nodes
 */
function setNewPadding(sankeyData) {
    columnMap = new Map();
    for (const [key, value] of Object.entries(sankeyData.nodes)) {
        if (columnMap.has(value.assessment)) {
            columnMap.set(value.assessment, columnMap.get(value.assessment) + 1)
        }
        else {
            columnMap.set(value.assessment, 1);
        }
    }
    let highestValue = 0;
    for (let value of columnMap.values()) {
        if (highestValue < value) {
            highestValue = value
        }
    }
    if (highestValue > 16) {
        padding = 20;
    }
    else if (highestValue > 10) {
        padding = 30;
    }
    else {
        padding = 40;
    }
    sankey = d3.sankey()
        .size([width, height])
        .nodeId(d => d.id)
        .nodeWidth(nodeWdt)
        .nodePadding(padding)
        .nodeAlign(d3.sankeyCenter)
        .nodeSort(null);
}


/** 
 * Animation section
 */

/**
* Takes in a graph and puts all points into
* object
*/
function populatePointStorageObj(graph) {
    for (const node of graph.nodes) {
        if (!(node.assessment in oldGraphPoints)) {
            oldGraphPoints[node.assessment] = {}
        }
        oldGraphPoints[node.assessment][node.name] =
        {
            "y0": node.y0,
            "y1": node.y1,
            "rectHeight": node.rectHeight,
            "value": node.value
        }
    }
}

/**
 * Takes in a new graph and stores points
 * in objects
 */
function storeNewPoints(graph) {
    newGraphPoints = {};
    for (const node of graph.nodes) {
        if (!(node.assessment in newGraphPoints)) {
            newGraphPoints[node.assessment] = {}
        }
        newGraphPoints[node.assessment][node.name] =
        {
            "y0": node.y0,
            "y1": node.y1,
            "rectHeight": node.y1 - node.y0,
            "value": node.value,
            "id": node.id
        }
    }
}

/**
 * Checks to see which nodes are in the new graph
 * but are not in the old graph
 */
function newNotInOld() {
    newNodes = new Set();
    for (const [examName, examValue] of Object.entries(newGraphPoints)) {
        for (const [gradeName, node] of Object.entries(examValue)) {
            if (!(gradeName in oldGraphPoints[examName])) {
                newNodes.add([examName, gradeName, node.value].toString());
            }
            else if (node.value !== oldGraphPoints[examName][gradeName]["value"]) {
                newNodes.add([examName, gradeName, node.value].toString());
            }
        }
    }
    return newNodes
}

/**
 * Checks to see which nodes are in old graph but
 * not in new graph
 */
function oldNotInNew() {
    oldNodes = new Set();
    for (const [examName, examValue] of Object.entries(oldGraphPoints)) {
        for (const [gradeName, node] of Object.entries(examValue)) {
            if (!(gradeName in newGraphPoints[examName])) {
                oldNodes.add([examName, gradeName, node.value].toString());
            }
            else if (node.value !== newGraphPoints[examName][gradeName]["value"]) {
                oldNodes.add([examName, gradeName, node.value].toString());
            }
        }
    }
    return oldNodes
}


/**
 * Function to fill the old link storage
 * object with data
 */
function populateLinkStorageObj(graph) {
    oldLinks = {};
    oldLinksMap = new Map();
    for (const link of graph.links) {
        const sourceA = link.source.assessment;
        const sourceG = link.source.name;
        const targetA = link.target.assessment;
        const targetG = link.target.name;

        if (!(sourceA in oldLinks))
            oldLinks[sourceA] = {}
        if (!(sourceG in oldLinks[sourceA]))
            oldLinks[sourceA][sourceG] = {}
        if (!(targetA in oldLinks[sourceA][sourceG]))
            oldLinks[sourceA][sourceG][targetA] = {}
        if (!(targetG in oldLinks[sourceA][sourceG][targetA]))
            oldLinks[sourceA][sourceG][targetA][targetG] = {}

        oldLinks[sourceA][sourceG][targetA][targetG] = {
            "y0": link.y0,
            "y1": link.y1,
            "width": link.width,
            "value": link.value
        }
        oldLinksMap.set([sourceA, sourceG, targetA, targetG].toString(), {
            "y0": link.y0,
            "y1": link.y1,
            "width": link.width,
            "value": link.value
        });

    }
}

/** 
 * Stores new links in a new links object
 */
function storeNewLinks(graph) {
    newLinks = {};
    newLinksMap = new Map();
    for (const link of graph.links) {
        const sourceA = link.source.assessment;
        const sourceG = link.source.name;
        const targetA = link.target.assessment;
        const targetG = link.target.name;

        if (!(sourceA in newLinks))
            newLinks[sourceA] = {}
        if (!(sourceG in newLinks[sourceA]))
            newLinks[sourceA][sourceG] = {}
        if (!(targetA in newLinks[sourceA][sourceG]))
            newLinks[sourceA][sourceG][targetA] = {}
        if (!(targetG in newLinks[sourceA][sourceG][targetA]))
            newLinks[sourceA][sourceG][targetA][targetG] = {}

        newLinks[sourceA][sourceG][targetA][targetG] = {
            "y0": link.y0,
            "y1": link.y1,
            "width": link.width,
            "value": link.value
        }
        newLinksMap.set([sourceA, sourceG, targetA, targetG].toString(), {
            "y0": link.y0,
            "y1": link.y1,
            "width": link.width,
            "value": link.value
        });
    }
}

/**
 * Checks to see which links are in old graph 
 * that are not in new graph
 * @param {*} brokeExam --> broken down exam
 * @param {*} brokeGrade --> broken down grade
 */
function oldLinkNotinNewSet(brokeExam, brokeGrade) {
    oldLinksSet = new Set();
    oldLinksObj = {};
    oldLinksObj['right'] = {}
    oldLinksObj['left'] = {}
    for (const key of oldLinksMap.keys()) {
        [first, firstG, sec, secG] = key.split(',');
        if (!newLinksMap.has(key)) {
            oldLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                oldLinksObj['right'][secG] = oldLinks[first][firstG][sec][secG]
            }
            else {
                oldLinksObj['left'][firstG] = oldLinks[first][firstG][sec][secG]
            }
        }
        else if (newLinksMap.get(key).value !== oldLinksMap.get(key).value) {
            oldLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                oldLinksObj['right'][secG] = oldLinks[first][firstG][sec][secG]
            }
            else {
                oldLinksObj['left'][firstG] = oldLinks[first][firstG][sec][secG]
            }
        }
        else if ((sec === brokeExam && secG === brokeGrade) || (first === brokeExam && firstG === brokeGrade)) {
            oldLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                oldLinksObj['right'][secG] = oldLinks[first][firstG][sec][secG]
            }
            else {
                oldLinksObj['left'][firstG] = oldLinks[first][firstG][sec][secG]
            }
        }
    }
    return [oldLinksSet, oldLinksObj];
}

/**
 * Checks to see which links are in new graph 
 * that are not in old graph
 * @param {*} brokeExam --> broken down exam
 * @param {*} brokeGrade --> broken down grade
 */
function newLinkNotinOldSet(brokeExam, brokeGrade, isBreakdown) {
    newLinksSet = new Set();
    newLinksObj = {}
    newLinksObj['right'] = {}
    newLinksObj['left'] = {}
    for (const key of newLinksMap.keys()) {
        [first, firstG, sec, secG] = key.split(',');
        if (!oldLinksMap.has(key)) {
            newLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
            }
            else {
                newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
            }
        }
        else if (oldLinksMap.get(key).value !== newLinksMap.get(key).value) {
            newLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
            }
            else {
                newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
            }
        }
        else if (!isBreakdown && (!isNumber(brokeGrade)) && ((sec === brokeExam && secG[0] === brokeGrade[0]) || (first === brokeExam && firstG[0] === brokeGrade[0]))) {
            newLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
            }
            else {
                newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
            }
        }
        else if (!isBreakdown && (isNumber(brokeGrade)) && ((sec === brokeExam && secG === brokeGrade) || (first === brokeExam && firstG === brokeGrade))) {
            newLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
            }
            else {
                newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
            }
        }
        else if (isBreakdown && (sec === brokeExam && secG === brokeGrade) || (first === brokeExam && firstG === brokeGrade)) {
            newLinksSet.add(key);
            if (brokeExam.localeCompare(first) === 0) {
                newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
            }
            else {
                newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
            }
        }
    }
    return [newLinksSet, newLinksObj];
}

/**
 * Function to return the color for a node
 * based on its name
 */
function getNodeColor(nodeName) {
    /* case for whole letter grade nodes */
    if (letrs.has(nodeName))
        return sankeyColor(nodeName);
    /* case for + and - grade nodes */
    if (letrs.has(nodeName[0]))
        return getShadePlusMinus(sankeyColor(nodeName[0]), nodeName[1]);
    /* case for number grade nodes */
    return getShadeNumber(sankeyColor(gradeScale(nodeName)), nodeName);
}

/**
 * Checks to see if a node name is a number
 */
function isNumber(name) {
    return parseInt(name) >= 0 && parseInt(name) <= 100
}