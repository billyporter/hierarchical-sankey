

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
 * Populates grade level map
 * i.e. 
 * 0: A
 * 1: A, A-
 * 2: 90, 91, ..., 100
 */
function populateGradeLevelMap() {
    let id = 0;
    for ([index, assessment] of assessments.entries()) {
        assessGradeLevelMap[assessment] = {};
        for ([jndex, grade] of grades.entries()) {
            assessGradeLevelMap[assessment][grade] = { "level": 0, "+": 0, "-": 0, "def": 0 };
        }
    }
}

/**
* Filters out PC lines when node hovered
*/
function hoverBehavior(i, flag) {

    /* Filtered Data */
    const filteredReturn = filterParallelData(i.source.name, i.target.name, i.source.assessment, i.target.assessment);
    const filteredData = filteredReturn[0];
    const totalGroups = filteredReturn[1];

    /* Build colors */
    const colorArray = createColorMap(totalGroups);

    show = new Set(filteredData.map(x => x['id']));
    d3.selectAll(".lines").each(function (d) {
        d3.select(this).style("visibility", () => show.has(d['id']) ? "visible" : "hidden")
            .style("stroke", deflineColor)
            .style("opacity", 0.6);
    });
    if (flag) {
        buildLegend(colorArray, filteredReturn[2], filteredData, filteredReturn[3]);
    }
}

/**
 * Function to create color mapping based on size of input
 */
function createColorMap(i) {
    //const priority = ["#ff79c6", "#ff5555", "#ffb86c", "#f1fa8c", "#50fa7b", "#8be9fd", "#bd93f9", "#6272a4", "#44475a"]; //dracula standard
    //const priority = ["#f088bd", "#F29A85", "#F7CB8B", "#FBFE92", "#50fa7b", "#A5FC8F", "#9FFCEA", "#9183F7", "#44475a"]; //dracula pro
    const priority = ["#ff79c6", "#ff5555", "#f5b042", "#f5dd42", "#50fa7b", "#8be9fd", "#a442f5", "#44475a"]; //modified dracula

    for (let j = priority.length; j <= i; j++) {
        priority.push("#AA00FF");
    }

    return priority
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

            /* Curr level = level of breakdown (0 = no breakdown) */
            const currLevel = assessGradeLevelMap[assessment][grade]["level"];
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
                        dict[id++] = { [assessment.trim()]: grade.concat("-") };
                    }
                    else {
                        dict[id++] = { [assessment.trim()]: "0-59" };
                    }
                    break;
                /* TODO: add case 2: (indiivual scores) */
                case 2:
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
                        else {
                            if (subgrade.localeCompare("+") === 0) {
                                if (grade !== 'A' && grade !== 'F') {
                                    dict[id++] = { [assessment.trim()]: grade.concat(subgrade) };
                                }
                            }
                            if (subgrade.localeCompare("-") === 0) {
                                if (grade !== 'F') {
                                    dict[id++] = { [assessment.trim()]: grade.concat(subgrade) };
                                }
                            }
                            if (subgrade.localeCompare("def") === 0) {
                                dict[id++] = { [assessment.trim()]: grade };
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
        dict[Object.keys(value)[0].trim()][Object.values(value)[0]] = {
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

            if (index < 3) {
                let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                let copyNextGrade = student[1][assessments[index + 1]];
                if (nextGrade == "") {
                    continue;
                }
                let level = assessGradeLevelMap[assessments[index + 1]][nextGrade]["level"];
                if (level === 1) {
                    nextGrade = specificLetterScale(nextGrade, student[1][assessments[index + 1]]);
                    if (nextGrade.localeCompare('F') === 0) {
                        nextGrade = "0-59";
                    }
                }
                if (level === 2) {
                    nextGrade = specificLetterScale(nextGrade, student[1][assessments[index + 1]]);
                    if (nextGrade.length === 1 && assessGradeLevelMap[assessments[index + 1]][nextGrade]["def"] === 2) {
                        nextGrade = copyNextGrade;
                    }
                    else if (assessGradeLevelMap[assessments[index + 1]][nextGrade[0]][nextGrade[nextGrade.length - 1]] === 2) {
                        nextGrade = copyNextGrade;
                    }
                }
                let source = output["grades"][assessment.trim()][grade]["id"]; // prev grade id
                let target = output["grades"][assessments[index + 1].trim()]
                [nextGrade]["id"]; // next grade id

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
 * Hierarchical Node
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
    const locGrade = node['name'];

    /* Need to add space if final exam */
    let stringToInput = locAs;
    if (locAs.localeCompare('Final Exam') === 0)
        stringToInput = ' '.concat(locAs);

    /* Check if letter */
    let currLevel;
    let newLevel;
    if (letrs.has(locGrade[0])) {
        currLevel = assessGradeLevelMap[stringToInput][locGrade[0]]["level"]
        newLevel = currLevel + (flag ? 1 : -1 * currLevel);

        /* Keep new level in range 0-2 */
        newLevel = newLevel > 2 ? 2 : newLevel;

        assessGradeLevelMap[stringToInput][locGrade[0]]["level"] = newLevel;
        /* Expand to percentages if level of 2 */
        if (newLevel === 2) {
            if (locGrade.length > 1)
                assessGradeLevelMap[stringToInput][locGrade[0]][locGrade[1]] = 2;
            else
                assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 2;
        }
        else {
            assessGradeLevelMap[stringToInput][locGrade[0]]["+"] = 0;
            assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 0;
            assessGradeLevelMap[stringToInput][locGrade[0]]["-"] = 0;
        }
    }
    else if (!flag) {
        /* IF F set back to 0 */
        if (locGrade.localeCompare("0-59") === 0) {
            assessGradeLevelMap[stringToInput]["F"]["level"] = 0
        }
        /* If number, clear */
        else {
            const specLetter = specificLetterScale(gradeScale(locGrade), locGrade);
            if (specLetter.length > 1)
                assessGradeLevelMap[stringToInput][specLetter[0]][specLetter[1]] = 0;
            else
                assessGradeLevelMap[stringToInput][specLetter[0]]["def"] = 0;
        }
    }

    // const newSankey = formatSankey();
    const treeSankey = formatTreeSankey(node);
    if (newLevel == undefined) {
        newLevel = -1;
    }
    // removePlots();
    // drawSankey(newSankey, false, flag, oldGraph, stringToInput, locGrade, newLevel);
    // removeTreePlots();
    drawTreeSankey(node, treeSankey);
}

/**
 * Function to remove svg
 */
function removePlots() {
    d3.selectAll(".nodes").remove();
    d3.selectAll(".link").remove();
    d3.selectAll(".axes").remove();
    d3.selectAll(".lines").remove();
    d3.selectAll(".tree").remove();
}

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