/**
 * Returns data of the following form:
 * {
 *      "nodes": [
 *          {"node": 0, "name": "A"},
 *          {"node": 1, "name": "B"},
 *          ...
 *      ]
 *      "links": [
 *          {"source": <FIRSTASSIGN_LETTER>, "target": <SECONDASSIGN_LETTEr>, "value": <NUMBER_OF_STUDENTS_FROM_FIRST_TO_SECOND}
 *      ]
 * }
 * 
 * IMPORTANT: Will need a letter grade for each assignment, so there should be
 * (number of assignments) * (number of letters) = totalNodes
 * 
 */
const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];
const grades = ["A", "B", "C", "D", "F"];

const width = 800;
const height = 500;
const svgBackground = "#eff";
const svgBorder = "1px solid #333";
const margin = 10;

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
function createGrades() {
    dict = {};

    let id = 0;
    for ([index, assessment] of assessments.entries()) {
        dict[assessment.trim()] = {};
        for ([jndex, grade] of grades.entries()) {
            dict[assessment.trim()][grade] = { "id": id++, "count": 0 };
        }
    }
    console.log(dict);
    return dict;
}

function createNodes() {
    nodes = [];

    let id = 0;
    for ([index, assessment] of assessments.entries()) {
        for ([jndex, grade] of grades.entries()) {
            nodes.push({ "id": id++ });
        }
    }
    return nodes;
}

function createLinks() {
    /* links = [
        {"source": {"Exam 1": "A"}, "target": {"Exam 2": "A"}, "value": 0}, 
        ...
    ]
    */
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
    console.log(links);
    return links;
}

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
    console.log(output);
    return output;
}

const sankeyData = formatSankeyData(rawData);
// console.log(sankeyData);
const svg = d3.select("#canvas")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", svgBackground)
    .style("border", svgBorder)
    .append("g");

const sankey = d3.sankey()
    .size([width, height])
    .nodeId(d => d.id)
    .nodeWidth(20)
    .nodePadding(10)
    .nodeAlign(d3.sankeyCenter);
let graph = sankey(sankeyData);

let graphlink = svg
    .append("g")
    .classed("links", true)
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .classed("link", true)
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .attr("stroke", "#606060")
    .attr("stroke-width", d => d.width)
    .attr("stoke-opacity", 0.5);

let graphnode = svg
    .append("g")
    .classed("nodes", true)
    .selectAll("rect")
    .data(graph.nodes)
    .enter()
    .append("rect")
    .classed("node", true)
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", "blue")
    .attr("opacity", 0.8);