

/* Constants */
const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];
const grades = ["A", "B", "C", "D", "F"];
const margin = { top: 10, right: 10, bottom: 10, left: 10 }
const width = 700; //890;
const height = 582; //740;
const legendWidth = 600;
const legendHeight = 900;
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
// const sankeyColor = d3.scaleOrdinal()
//     .domain(['A', 'B', 'C', 'D', 'F'])
//     .range(['#4DD0E1', '#81C784', '#FFF176', '#FFCC80', '#FF8A65']);

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

function createIds() {
    dict = {};

    let id = 0;
    for ([index, assessment] of assessments.entries()) {
        assessGradeLevelMap[assessment] = {};
        for ([jndex, grade] of grades.entries()) {
            dict[id++] = { [assessment.trim()]: grade };
            assessGradeLevelMap[assessment][grade] = 0;
        }
    }
    return dict;
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


function createGrades() {
    dict = {};

    let id = 0;
    for ([index, assessment] of assessments.entries()) {
        dict[assessment.trim()] = {};
        for ([jndex, grade] of grades.entries()) {
            dict[assessment.trim()][grade] = { "id": id++, "count": 0 };
        }
    }
    return dict;
}


/**
 * [ {id: 0}, {id: 1}, ...]
 */
function createNodes() {
    nodes = [];

    let id = 0;
    for ([index, assessment] of assessments.entries()) {
        for ([jndex, grade] of grades.entries()) {
            nodes.push({ "id": id++, "name": grade, "assessment": assessment, "level": 0, "grades": [] });
        }
    }
    return nodes;
}


/**
 * [
 *      {source: current_index, target: target_index, value: 0}
 * ]
 * 
 * formatSankeyData updates values
 * 
 */
function createLinks() {
    links = [];

    for (column = 0; column < assessments.length - 1; column++) {
        for (first_row = 0; first_row < grades.length; first_row++) {
            const currPosition = column * grades.length + first_row;
            for (sec_row = 0; sec_row < grades.length; sec_row++) {
                const targPosition = (column + 1) * grades.length + sec_row;
                links.push({ "source": currPosition, "target": targPosition, "value": 0 });
            }
        }
    }
    return links;
}

/**
 * Creates letter object of raw data in following form:
 * {
 *      Exam 1:
 *          {
 *              A:
 *                  {
 *                      A: 
 *                        {
 *                            count: 5
 *                            grades: [96, 97, 98, 97, 96]
 *                         }   
 *                  }
 *          }
 * }
 */
function updateLetterObject(assessment, numberGrade) {
    const generalLetter = gradeScale(numberGrade);
    const specificLetter = specificLetterScale(generalLetter, numberGrade);
    gradeCountDict[assessment]
}

/**
 * Function that updates values of the links
 * and combines each function into one ouput
 * object
 */
function formatSankeyData(data) {

    output = {
        "ids": createIds(),
        "grades": createGrades(),
        "nodes": createNodes(),
        "links": createLinks()
    }

    for (student in data) {
        for ([index, assessment] of assessments.entries()) {
            const grade = gradeScale(data[student][assessment]);
            if (grade == "") {
                continue;
            }
            updateLetterObject(assessment, data[student][assessment]);
            output["grades"][assessment.trim()][grade]["count"]++;
            output["nodes"][output["grades"][assessment.trim()][grade]["id"]]["grades"].push(data[student][assessment]);

            if (index < 3) {
                let nextGrade = gradeScale(data[student][assessments[index + 1]]);
                if (nextGrade == "") {
                    continue;
                }
                let source = output["grades"][assessment.trim()][grade]["id"]; // prev grade id 
                let target = output["grades"][assessments[index + 1].trim()][gradeScale(data[student][assessments[index + 1]])]["id"]; // next grade id
                for ([index, link] of output["links"].entries()) { // if the link is from the source node to target node, add 1
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



/**
 * Initial drawing of Sankey 
 **/
const sankeyData = formatSankeyData(rawData);

/* Deep copy so it doesn't get edited by reference */
let copySankeyData = JSON.parse(JSON.stringify(sankeyData));
console.log(copySankeyData);

/* Sets up svg */
const svg = d3.select("#canvas")
    .attr("width", width + legendWidth)
    .attr("height", height + legendHeight)
    .append("g")
    .attr("transform", "translate(30, 30)");

/* Creates Sankey Object */
const sankey = d3.sankey()
    .size([width, height])
    .nodeId(d => d.id)
    .nodeWidth(nodeWdt)
    .nodePadding(padding)
    .nodeAlign(d3.sankeyCenter)
    .nodeSort(null);

/* Draws Sankey on SVG */
const graph = sankey(sankeyData);


/**
 * Hierarchical Node
 * Exploratory Section
 */


/** New appraoch */

/**
 * Routes from click behavior to create new data
 */
function wanedilliams(node) {

    /* Update Ids */
    const locAs = node['assessment'];
    const locGrade = node['name'];
    assessGradeLevelMap[locAs][locGrade] += 1;

    newIds = updateIDS();
    updateLinks(newIds);
}

/**
 * Update the ids with the new node expansion
 */
function updateIDS() {
    let id = 0;
    dict = {} // dict to hold ids
    for ([index, assessment] of assessments.entries()) {
        for ([jndex, grade] of grades.entries()) {

            /* Curr level = level of breakdown (0 = no breakdown) */
            const currLevel = assessGradeLevelMap[assessment][grade];
            switch (currLevel) {
                case 0:
                    dict[id++] = { [assessment.trim()]: grade };
                    break;
                case 1:
                    dict[id++] = { [assessment.trim()]: grade.concat("+") };
                    dict[id++] = { [assessment.trim()]: grade };
                    dict[id++] = { [assessment.trim()]: grade.concat("-") };
                /* TODO: add case 2: (indiivual scores) */
            }

        }
    }
    return dict;
}

/**
 * Updates links based on newIds
 */
function updateLinks(newIds) {

    links = [];
    let prevTop = 0; // top of previous column
    for (column = 0; column < assessments.length - 1; column++) {
        let firstColLength = 0;
        let secColLength = 0;

        /* Count length of columns based on expansion */
        for ([key, value] of Object.entries(newIds)) {
            if (assessments[column] === Object.keys(value)[0]) {
                firstColLength += 1;
            }
            if (assessments[column + 1].trim() === Object.keys(value)[0]) {
                secColLength += 1;
            }
        }
        for (first = 0; first < firstColLength; first++) {
            const currPosition = prevTop + first;
            for (second = 0; second < secColLength; second++) {
                const targPosition = prevTop + firstColLength + second;
                links.push({ "source": currPosition, "target": targPosition, "value": 0 });
            }
        }
        prevTop += firstColLength;
    }
}





/**
* Function that serves as the first step and routes to either
* breakdown from:
* 1) Letter to Letter+ Letter Letter-
* 2) Letter+ to Number
*/
function breakdownRouter(nodeID) {
    const level = copySankeyData["nodes"][nodeID]["level"];
    switch (level) {
        case 0:
            breakdownRawLetter(nodeID);
            break;
        case 1:
            break;
    }
}


/**
 * Takes in nodeId and returns new Sankey
 */
function breakdownRawLetter(nodeId) {
    console.log('here');
    const nodeGrades = sankeyData['nodes'][nodeId]['grades'];
    const nodeLetter = sankeyData['nodes'][nodeId]['name'];

    let gradesMap = new Map();

    /* Divide into nodes */
    for (const g of nodeGrades) {
        const letter = specificLetterScale(nodeLetter, g);
        if (gradesMap.has(letter)) {
            gradesMap.get(letter).push(g);
        }
        else {
            gradesMap.set(letter, [g]);
        }
    }
    gradesMap = new Map([...gradesMap.entries()].sort());

    /* Create node for each key */
    let idCounter = nodeId + 1;
    for (const [key, value] of gradesMap.entries()) {
        console.log(key)
        const localNode = {
            'id': idCounter,
            'name': key,
            'assessment': sankeyData['nodes'][nodeId]['assessment'],
            'level': 1,
            'grades': value
        }
        idCounter += 1;
    }
}







/**
 * Test Driver section
 * */
breakdownRouter(1)

