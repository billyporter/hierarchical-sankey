

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
const nodeHistoryMap = {};

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
            dict[id++] = { [assessment.trim()]: grade };
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
                let sourceName = grades[first];
                let sourceExam = assessments[column];
                let targetName = grades[second];
                let targetExam = assessments[column + 1].trim();
                if (assessGradeLevelMap[sourceExam][sourceName] === 1) {
                    for (const grade of grades) {
                        links.push({ "source": currPosition, "target": targPosition, "value": 0, "sourceName": grade });
                    }
                }
                else {
                    links.push({ "source": currPosition, "target": targPosition, "value": 0 });
                }
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
            output["grades"][assessment.trim()][sourceNodeName]["count"]++;

            if (index < 3) {
                let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                if (nextGrade == "") {
                    continue;
                }
                let targetNodeName = nextGrade

                let source = output["grades"][assessment.trim()][sourceNodeName]["id"]; // prev grade id
                let target = output["grades"][assessments[index + 1].trim()]
                [targetNodeName]["id"]; // next grade id
                for (const [ind, link] of output["links"].entries()) {
                    if (sourceLevel === 1) {
                        let previousGrade = gradeScale(student[1][assessments[index - 1]]);
                        if (previousGrade == "") {
                            continue;
                        }
                        if (link["source"] == source && link["target"] == target) {
                            if (link["sourceName"] === previousGrade) {
                                output["links"][ind]["value"]++;
                            }
                        }
                    }
                    else if (link["source"] == source && link["target"] == target) {
                        output["links"][ind]["value"]++;
                    }
                }
            }
        }
    }
    console.log(output["links"])
    // return;
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
    // populateNodeHistoryMap(node);
    const oldGraph = formatSankey();

    /* Update Ids */
    const locAs = node['assessment'];
    const locGrade = node['name'][0];

    if (locAs.localeCompare('Exam 1') !== 0 && locAs.localeCompare('Final Exam') !== 0) {
        populateGradeLevelMap();
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
        drawSankey(newSankey, false, oldGraph);
    }
}


function populateNodeHistoryMap(node) {
    for (const student of Object.entries(rawData)) {
        for ([index, assessment] of assessments.entries()) {
            if (!student[1][assessment]) {
                continue;
            }
            let grade = gradeScale(student[1][assessment]);
            let sourceNodeName = grade;

            if (index < 3) {
                let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                if (nextGrade == "") {
                    continue;
                }
                let targetNodeName = nextGrade

                let source = output["grades"][assessment.trim()][sourceNodeName]["id"]; // prev grade id
                let target = output["grades"][assessments[index + 1].trim()]
                [targetNodeName]["id"]; // next grade id

                /* If destination is curr node, find out where it goes next */
                if (target === node.id) {
                    let nextTarget = gradeScale(student[1][assessments[index + 2]]);
                    if (nextTarget == "") {
                        continue;
                    }
                    if (!nodeHistoryMap[nextTarget]) {
                        nodeHistoryMap[nextTarget] = {}
                    }
                    if (!nodeHistoryMap[nextTarget][sourceNodeName]) {
                        nodeHistoryMap[nextTarget][sourceNodeName] = 1;
                    }
                    nodeHistoryMap[nextTarget][sourceNodeName]++;
                }
            }
        }
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