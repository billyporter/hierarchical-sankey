

/* Constants */
const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];
const assessTrim = ["Exam 1", "Exam 2", "Exam 3", "Final Exam"];
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
    .range([d3.hsv(178, 0.75, 0.67), d3.hsv(138, 0.75, 0.64), d3.hsv(55, 0.75, 0.89), d3.hsv(38, 0.75, 0.9), d3.hsv(8, 0.75, 0.85)]);
const assessGradeLevelMap = {};
const blacklist = new Set();

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
    color = d3.hsv(baseColor.h, baseColor.s, baseColor.v);
    if (sign == '-') {
        // 1/3 shade darker, maximum rgb value of 255
        color.s -= 0.25;
    } else if (sign == '+') {
        // 1/3 shade brighter
        color.s += 0.25;
    } else { // there is a bug if this case is reached
        return baseColor;
    }
    return color;
}

/* Gets color shade for number grades */
function getShadeNumber(baseColor, name) {
    color = d3.hsv(baseColor.h, baseColor.s, baseColor.v);

    //special case for 100
    if (name == "100") {
        color.s += 0.5;
        return color;
    }

    n = parseInt(name[1]); //examine the 1's column of the node name to determine shade

    // special case for F
    if (isNaN(n))
        return color;

    color.s += 0.08 * (n - 5);

    return color;
}

/* Returns corresponding letter grade */
function gradeScale(score) {
    if (!score) {
        return "";
    }
    if (!isNumber(score)) {
        return score;
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
            assessGradeLevelMap[assessment.trim()][grade] = { "level": 0, "+": 0, "-": 0, "def": 0 };
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
    hashSeen = new Set();
    for (const [index, assessment] of assessments.entries()) {
        for ([jndex, grade] of grades.entries()) {
            /* Curr level = level of breakdown (0 = no breakdown) */
            const currLevel = assessGradeLevelMap[assessment.trim()][grade]["level"];
            switch (currLevel) {
                case 0:
                    dict[id++] = { [assessment.trim()]: grade };
                    break;
                case 1:
                    if (grade !== 'F') {
                        if (grade !== 'A') {
                            dict[id++] = { [assessment.trim()]: grade.concat("+") };
                        }
                        dict[id++] = { [assessment.trim()]: grade };
                        blacklist.add(id);
                        dict[id++] = { [assessment.trim()]: grade.concat("#") };

                        dict[id++] = { [assessment.trim()]: grade.concat("-") };
                    }
                    else {
                        dict[id++] = { [assessment.trim()]: "0-59" };
                    }
                    break;
                /* TODO: add case 2: (indiivual scores) */
                case 2:
                    if (!hashSeen.has([assessment.trim(), grade].join())) {
                        dict[id++] = { [assessment.trim()]: grade };
                        hashSeen.add([assessment.trim(), grade].join());
                    }
                    /* Keep nodes that aren't level 2 */
                    for (const subgrade of ["+", "def", "-"]) {
                        const lev = assessGradeLevelMap[assessment][grade][subgrade]
                        if (lev) {
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
                        } /* Proceed as normal if not in second level */
                        if (subgrade.localeCompare("+") === 0) {
                            if (grade !== 'A' && grade !== 'F') {
                                dict[id++] = { [assessment.trim()]: grade.concat(subgrade) };
                            }
                            dict[id++] = { [assessment.trim()]: grade.concat("#") };
                        }
                        if (subgrade.localeCompare("-") === 0) {
                            if (grade !== 'F') {
                                dict[id++] = { [assessment.trim()]: grade.concat(subgrade) };
                            }
                        }
                    }

                    break;
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
    for (const [key, value] of Object.entries(newIds)) {
        for (const [key2, value2] of Object.entries(newIds)) {
            if (key === key2) {
                continue;
            }
            const sourceGrade = Object.values(value)[0];
            const targetGrade = Object.values(value2)[0];
            const sourceExamIndex = assessTrim.indexOf(Object.keys(value)[0]);
            const targetExamIndex = assessTrim.indexOf(Object.keys(value2)[0]);
            const sourceLevel = assessGradeLevelMap[Object.keys(value)[0]][gradeScale(sourceGrade[0])]["level"];
            const targetLevel = assessGradeLevelMap[Object.keys(value2)[0]][gradeScale(targetGrade[0])]["level"];
            if (sourceLevel === 1) {
                /* Check if base letter or specific */

                /* Base case, check if target is broken down same letter */
                if (sourceGrade.length === 1) {
                    if (targetLevel === 1
                        && sourceExamIndex === targetExamIndex
                        && sourceGrade[0] === targetGrade[0]) {
                        links.push({ "source": parseInt(key), "target": parseInt(key2), "value": 0 });
                    }
                }
                else if (sourceExamIndex !== assessTrim.length - 1 && targetExamIndex - sourceExamIndex === 1 && targetGrade.length === 1) {
                    links.push({ "source": parseInt(key), "target": parseInt(key2), "value": 0 });
                }
            }
            else if (sourceLevel === 2) {
                /* Base case, check if target is broken down same letter */
                if (sourceGrade.length === 1) {
                    if (targetLevel === 2
                        && sourceExamIndex === targetExamIndex
                        && sourceGrade[0] === targetGrade[0]
                        && !isNumber(sourceGrade)) {
                        links.push({ "source": parseInt(key), "target": parseInt(key2), "value": 0 });
                    }
                }
                else {
                    if (!isNumber(sourceGrade)) {
                        let suffix = sourceGrade[1];
                        if (suffix.localeCompare('#') === 0) {
                            suffix = 'def';
                        }
                        const suffixLevel = assessGradeLevelMap[Object.keys(value)[0]][sourceGrade[0]][suffix];
                        if (suffixLevel) {
                            // TODO: CHECK IF THE NUMBER IS IN SPECIFIC BREAKDOWN
                            /*
                            1) Is it a number
                            2) Is it the same exam?
                            3) Is it the specific letter breakdown?
                            */
                            let sourceChanged = sourceGrade;
                            if (sourceGrade[1] == '#') {
                                sourceChanged = sourceGrade[0];
                            }
                            if (isNumber(targetGrade)
                                && targetExamIndex === sourceExamIndex
                                && specificLetterScale(gradeScale(targetGrade), targetGrade) === sourceChanged) {
                                links.push({ "source": parseInt(key), "target": parseInt(key2), "value": 0 });
                            }
                        }
                        else {
                            if (sourceExamIndex !== assessTrim.length - 1 && targetExamIndex - sourceExamIndex === 1 && targetGrade.length === 1) {
                                links.push({ "source": parseInt(key), "target": parseInt(key2), "value": 0 });
                            }
                        }
                    }
                    /* It is a number */
                    else {
                        if (sourceExamIndex !== assessTrim.length - 1 && targetExamIndex - sourceExamIndex === 1 && targetGrade.length === 1) {
                            links.push({ "source": parseInt(key), "target": parseInt(key2), "value": 0 });
                        }
                    }
                }
            }
            else if (targetGrade.length > 1) {
                continue;
            }
            else if (sourceExamIndex !== assessTrim.length - 1 && targetExamIndex - sourceExamIndex === 1) {
                links.push({ "source": parseInt(key), "target": parseInt(key2), "value": 0 });
            }
        }
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
            let sourceLevel = assessGradeLevelMap[assessment.trim()][grade]["level"];
            if (sourceLevel === 1) {
                let targetNodeName = specificLetterScale(grade, student[1][assessment]);
                if (targetNodeName.length === 1) {
                    targetNodeName += '#';
                }
                let source1 = output["grades"][assessment.trim()][sourceNodeName]["id"];
                let target1 = output["grades"][assessment.trim()][targetNodeName]["id"];
                if (grade.localeCompare('F') === 0) {
                    previousGrade = "0-59";
                }
                for (const [index, link] of output["links"].entries()) {
                    if (JSON.stringify(link["source"]) == source1 && JSON.stringify(link["target"]) == target1) {
                        output["links"][index]["value"]++;
                    }
                }
                sourceNodeName = targetNodeName;
            }
            else if (sourceLevel === 2) {

                /* Handle case of B -> B+ / B# / B- */
                let targetNodeName = specificLetterScale(grade, student[1][assessment]);
                if (targetNodeName.length === 1) {
                    targetNodeName += '#';
                }
                let source1 = output["grades"][assessment.trim()][sourceNodeName]["id"];
                let target1 = output["grades"][assessment.trim()][targetNodeName]["id"];
                if (grade.localeCompare('F') === 0) {
                    previousGrade = "0-59";
                }
                for (const [index, link] of output["links"].entries()) {
                    if (JSON.stringify(link["source"]) == source1 && JSON.stringify(link["target"]) == target1) {
                        output["links"][index]["value"]++;
                    }
                }
                sourceNodeName = targetNodeName;

                /* Check to see if need to break into percentages */
                let specSourceGrade = specificLetterScale(grade, student[1][assessment]);
                let suffix = specSourceGrade[specSourceGrade.length - 1];
                if (specSourceGrade.length === 1) {
                    suffix = 'def'
                }
                let specSourceLevel = assessGradeLevelMap[assessment.trim()][grade][suffix];

                /* Handle case of B+ -> 89 / 88 / 87 */
                if (specSourceLevel) {
                    if (specSourceGrade.length === 1) {
                        specSourceGrade += '#';
                    }
                    let source1 = output["grades"][assessment.trim()][specSourceGrade]["id"];
                    let target1 = output["grades"][assessment.trim()][student[1][assessment]]["id"];
                    for (const [index, link] of output["links"].entries()) {
                        if (JSON.stringify(link["source"]) == source1 && JSON.stringify(link["target"]) == target1) {
                            output["links"][index]["value"]++;
                        }
                    }
                    sourceNodeName = student[1][assessment];
                }
            }
            output["grades"][assessment.trim()][sourceNodeName]["count"]++;

            if (index < 3) {
                let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                if (nextGrade == "") {
                    continue;
                }
                let targetNodeName = nextGrade
                let source = output["grades"][assessment.trim()][sourceNodeName]["id"]; // prev grade id
                let target = output["grades"][assessments[index + 1].trim()][targetNodeName]["id"]; // next grade id

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
    let locGrade = node['name'];

    if (isNumber(locGrade)) {
        locGrade = specificLetterScale(gradeScale(locGrade), locGrade);
        if (locGrade.length === 1) {
            locGrade += '#';
        }
    }

    if (!flag && assessGradeLevelMap[locAs][locGrade[0]]["level"] === 1) {
        locGrade = locGrade[0];
    }

    if (flag && letrs.has(locGrade) && assessGradeLevelMap[locAs][locGrade]["level"] > 0) {
        return;
    }

    /* Need to add space if final exam */
    let stringToInput = locAs;

    /* Do nothing for F */
    if (locGrade.localeCompare('F') === 0 || locAs === 'Final Exam') {
        return;
    }

    if (letrs.has(locGrade[0])) {
        currLevel = assessGradeLevelMap[stringToInput][locGrade[0]]["level"]

        if (flag || currLevel !== 2) {
            newLevel = currLevel + (flag ? 1 : -1 * currLevel);;
        }

        /* Keep new level in range 0-2 */
        newLevel = newLevel > 2 ? 2 : newLevel;

        assessGradeLevelMap[stringToInput][locGrade[0]]["level"] = newLevel;
        /* Expand to percentages if level of 2 */
        if (newLevel === 2) {
            if (flag) {
                if (locGrade.length > 1 && locGrade[1] !== '#')
                    assessGradeLevelMap[stringToInput][locGrade[0]][locGrade[1]] = 2;
                else
                    assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 2;
            }
            else if (!letrs.has(locGrade)) {
                if (locGrade.length > 1 && locGrade[1] !== '#')
                    assessGradeLevelMap[stringToInput][locGrade[0]][locGrade[1]] = 0;
                else
                    assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 0;

                if (assessGradeLevelMap[stringToInput][locGrade[0]]["+"] === 0
                    && assessGradeLevelMap[stringToInput][locGrade[0]]["def"] === 0
                    && assessGradeLevelMap[stringToInput][locGrade[0]]["-"] === 0) {
                    newLevel = 1;
                }
            }
            else {
                newLevel = 0;
                assessGradeLevelMap[stringToInput][locGrade[0]]["+"] = 0;
                assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 0;
                assessGradeLevelMap[stringToInput][locGrade[0]]["-"] = 0;
            }
        }
        else if (newLevel === 1) {
            assessGradeLevelMap[stringToInput][locGrade[0]]["+"] = 0;
            assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 0;
            assessGradeLevelMap[stringToInput][locGrade[0]]["-"] = 0;
        }
        else {
            let suffix = locGrade[1];
            if (locGrade[1] === '#') {
                suffix = 'def'
            }
            assessGradeLevelMap[stringToInput][locGrade[0]][suffix] = 0;
        }
    }
    else if (!flag) {
        /* If number, clear */
        const specLetter = specificLetterScale(gradeScale(locGrade), locGrade);
        if (specLetter.length > 1)
            assessGradeLevelMap[stringToInput][specLetter[0]][specLetter[1]] = 0;
        else
            assessGradeLevelMap[stringToInput][specLetter[0]]["def"] = 0;
    }
    assessGradeLevelMap[stringToInput][locGrade[0]]["level"] = newLevel;
    const newSankey = formatSankey();
    removePlots();
    drawSankey(newSankey, false, flag, oldGraph, stringToInput, locGrade, newLevel);
}


/**
 * Function to remove svg
 */
function removePlots() {
    d3.selectAll(".nodes").remove();
    d3.selectAll(".link").remove();
    d3.selectAll(".axis-label").remove();
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


/** Returns specific letter */
function specificLetterScale(letter, number) {
    const secondDigit = parseInt(number.toString()[number.toString().length - 1]);
    if (letter.localeCompare("A") == 0) {
        if (number >= 94) {
            return 'A'
        }
        return 'A-'
    }
    else if (letter.localeCompare("F") == 0) {
        return letter;
    }
    else if (secondDigit >= 7) {
        return letter.concat("+");
    }
    else if (secondDigit >= 4) {
        return letter
    }
    else {
        return letter.concat("-");
    }
}

/**
 * Checks to see if a node name is a number
 */
function isNumber(name) {
    return parseInt(name) >= 0 && parseInt(name) <= 100
}

/**
 * Animation section
 * 
 * 
 * 
 * 
 * 
 * 
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
            "x0": node.x0,
            "x1": node.x1,
            "y0": node.y0,
            "y1": node.y1,
            "rectHeight": node.rectHeight,
            "value": node.value
        }
    }
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
            "x0": node.x0,
            "x1": node.x1,
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
function newNotInOld(brokeExam, brokeGrade, isBreakdown) {
    newNodes = new Set();
    for (const [examName, examValue] of Object.entries(newGraphPoints)) {
        for (const [gradeName, node] of Object.entries(examValue)) {
            if (!(gradeName in oldGraphPoints[examName])) {
                newNodes.add([examName, gradeName, node.value].toString());
            }
            else if (node.value !== oldGraphPoints[examName][gradeName]["value"]) {
                newNodes.add([examName, gradeName, node.value].toString());
            }
            if (!isBreakdown) {
                if (examName === brokeExam && gradeName === brokeGrade) {
                    newNodes.add([examName, gradeName, node.value].toString());
                }
            }
        }
    }
    return newNodes
}

/**
 * Checks to see which nodes are in old graph but
 * not in new graph
 */
function oldNotInNew(brokeExam, brokeGrade, isBreakdown) {
    oldNodes = new Set();
    for (const [examName, examValue] of Object.entries(oldGraphPoints)) {
        for (const [gradeName, node] of Object.entries(examValue)) {
            if (isBreakdown && examName === brokeExam && gradeName === brokeGrade) {
                oldNodes.add([examName, gradeName, node.value].toString());
            }
            if (!isBreakdown && examName === brokeExam && (!(gradeName in newGraphPoints[examName]))) {
                oldNodes.add([examName, gradeName, node.value].toString());
            }
        }
    }
    return oldNodes
}

/**
 * Checks to see which links are in old graph 
 * that are not in new graph
 * @param {*} brokeExam --> broken down exam
 * @param {*} brokeGrade --> broken down grade
 */
function oldLinkNotinNewSet(brokeExam, brokeGrade, isBreakdown) {
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
    }
    return [newLinksSet, newLinksObj];
}

function setNewWidth(sankeyData) {
    let widthAdder = 0;
    for (const [key, value] of Object.entries(assessGradeLevelMap)) {
        let temp = 0;
        for (const [key1, value1] of Object.entries(value)) {
            if (value1.level > temp) {
                if (value1.level == 2) {
                    temp = 1.5;
                }
                else {
                    temp = value1.level;
                }
            }
        }
        widthAdder += temp;
    }


    if (sankeyData.nodes.length > 20) {
        /* Sets up svg */
        sankey = d3.sankey()
            .size([width + widthAdder * 100, height])
            .nodeId(d => d.id)
            .nodeWidth(nodeWdt)
            .nodePadding(padding)
            .nodeAlign(d3.sankeyCenter)
            .nodeSort(null);

    }


}