

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
    .range(['#00ABA5', '#00A231', '#e2d000', '#E69200', '#DA1D02']);
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
                        dict[id++] = { [assessment.trim()]: grade.concat("#") };
                        hashSeen.add([assessment.trim(), grade].join());
                    }
                    /* Keep nodes that aren't level 2 */
                    for (const subgrade of ["+", "def", "-"]) {
                        const lev = assessGradeLevelMap[assessment][grade][subgrade]
                        console.log(assessGradeLevelMap)
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
    console.log(dict);
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
                else if (sourceExamIndex !== assessTrim.length - 1 && targetExamIndex - sourceExamIndex === 1) {
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
                    let suffix = sourceGrade[1];
                    if (suffix.localeCompare('#') === 0) {
                        suffix = 'def';
                    }
                    const suffixLevel = assessGradeLevelMap[Object.keys(value)[0]][sourceGrade[0]][suffix];
                    if (suffixLevel) {
                        // TODO: CHECK IF THE NUMBER IS IN SPECIFIC BREAKDOWN
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
    console.log(newGrades);
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
            output["grades"][assessment.trim()][sourceNodeName]["count"]++;

            if (index < 3) {
                let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                if (nextGrade == "") {
                    continue;
                }
                let targetLevel = assessGradeLevelMap[assessments[index + 1].trim()][nextGrade]["level"];
                let targetNodeName = nextGrade
                if (targetLevel === 1) {
                    targetNodeName = specificLetterScale(targetNodeName, student[1][assessments[index + 1]]);
                    if (targetNodeName.localeCompare('F') === 0) {
                        targetNodeName = "0-59";
                    }
                }
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
    const locGrade = node['name'];

    /* Need to add space if final exam */
    let stringToInput = locAs;
    if (locAs.localeCompare('Final Exam') === 0)
        stringToInput = ' '.concat(locAs);

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
    const newSankey = formatSankey();
    removePlots();
    drawSankey(newSankey, false, flag, oldGraph, stringToInput, locGrade);
}


/**
 * Function to remove svg
 */
function removePlots() {
    d3.selectAll(".nodes").remove();
    d3.selectAll(".link").remove();
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