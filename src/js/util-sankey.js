

/* Constants */
const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];
const grades = ["A", "B", "C", "D", "F"];
const width = 700; //890;
const height = 582; //740;
const legendWidth = 200;
const legendHeight = 400;
const svgBackground = "#eff";
const svgBorder = "1px solid #333";
const margin = 10;
const padding = 40;
const nodeWdt = 36;
// const sankeyColor = d3.scaleOrdinal()
//     .domain(['A', 'B', 'C', 'D', 'F'])
//     .range(['#00ABA5', '#00A231', '#e2d000', '#E69200', '#DA1D02']);
const sankeyColor = d3.scaleOrdinal()
    .domain(['A', 'B', 'C', 'D', 'F'])
    .range(['#4DD0E1', '#81C784', '#FFF176', '#FFCC80', '#FF8A65']);

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
        for ([jndex, grade] of grades.entries()) {
            dict[id++] = { [assessment.trim()]: grade };
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
            nodes.push({ "id": id++, "name": grade, "assessment": assessment });
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
            let grade = gradeScale(data[student][assessment]);
            if (grade == "") {
                continue;
            }
            output["grades"][assessment.trim()][grade]["count"]++;

            if (index < 3) {
                let nextGrade = gradeScale(data[student][assessments[index + 1]]);
                if (nextGrade == "") {
                    continue;
                }
                let source = output["grades"][assessment.trim()][grade]["id"];
                let target = output["grades"][assessments[index + 1].trim()][gradeScale(data[student][assessments[index + 1]])]["id"];
                for ([index, link] of output["links"].entries()) {
                    if (JSON.stringify(link["source"]) == source && JSON.stringify(link["target"]) == target) {
                        output["links"][index]["value"]++;
                    }
                }
            }
        }
    }
    return output;
}

/* Filters out PC lines when node hovered*/

function hoverBehavior(i) {

    /* Filtered Data */
    const filteredReturn = filterParallelData(i.source.name, i.target.name, i.source.assessment, i.target.assessment);
    const filteredData = filteredReturn[0];
    const totalGroups = filteredReturn[1];
    console.log(filteredData);

    /* Build colors */
    const colorArray = createColorMap(totalGroups);

    show = new Set(filteredData.map(x => x['id']));
    d3.selectAll(".lines").each(function (d) {
        d3.select(this).style("visibility", () => show.has(d['id']) ? "visible" : "hidden")
            .style("stroke", colorArray[d['group']]);
    });
}

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

/* Sets up svg */
const svg = d3.select("#canvas")
    .attr("width", width + legendWidth)
    .attr("height", height + legendHeight)
    .append("g");

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