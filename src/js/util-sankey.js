

/* Constants */
const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];
const grades = ["A", "B", "C", "D", "F"];
const margin = { top: 10, right: 10, bottom: 10, left: 10 }
const svgBackground = "#eff";
const svgBorder = "1px solid #333";
const padding = 40;
const nodeWdt = 36;
const deflineColor = "#90A4AE";
let isActive = false;
let activeLink = -1;
const gradeCountDict = {};
const sankeyColor = d3.scaleOrdinal()
    .domain(['A', 'B', 'C', 'D', 'F'])
    .range(['#00ABA5', '#00A231', '#e2d000', '#E69200', '#DA1D02']);
const assessGradeLevelMap = {};

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
        buildLegend(colorArray, filteredReturn[2], filteredData);
    }
}

/**
 * Function to create color mapping based on size of input
 */
function createColorMap(i) {
    const priority = ["#880E4F", "#311B92", "#b71c1c", "#3E2723", "#004D40", "#BF360C", "#1A237E", "#AA00FF", "#E65100"];
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
            "level": 0,
            "grades": []
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
            output["nodes"][output["grades"][assessment.trim()][grade]["id"]]["grades"]
                .push(student[1][assessment]);

            if (index < 3) {
                let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                let copyNextGrade = student[1][assessments[index + 1]];
                if (nextGrade == "") {
                    continue;
                }
                let level = assessGradeLevelMap[assessments[index + 1]][nextGrade]["level"];
                if (level === 1) {
                    nextGrade = specificLetterScale(nextGrade, student[1][assessments[index + 1]]);
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
 */
function wanedilliams(node) {

    /* Update Ids */
    const locAs = node['assessment'];
    const locGrade = node['name'];
    let stringToInput = locAs;
    if (locAs.localeCompare('Final Exam') === 0) {
        stringToInput = ' '.concat(locAs);
    }
    if (locGrade.length > 1) {
        assessGradeLevelMap[stringToInput][locGrade[0]][locGrade[1]] = 2;
        assessGradeLevelMap[stringToInput][locGrade[0]]["level"] = 2;
    }
    else {
        if (assessGradeLevelMap[stringToInput][locGrade]["level"] < 2) {
            assessGradeLevelMap[stringToInput][locGrade]["level"] += 1;
        }
        if (assessGradeLevelMap[stringToInput][locGrade]["level"] === 2) {
            assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 2;
        }
    }

    const newSankey = formatSankey();
    removePlots();
    drawSankey(newSankey);
}

function removePlots() {
    d3.selectAll(".nodes").remove();
    d3.selectAll(".link").remove();
    d3.selectAll(".axes").remove();
    d3.selectAll(".lines").remove();
}