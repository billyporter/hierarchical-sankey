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
const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam", "Calculated Grade"];
const grades = ["A", "B", "C", "D", "F"];

function gradeScale(score){
    if(!score){
        return "";
    }
    if(score >= 90){
        return "A";
    } else if (score >= 80){
        return "B";
    } else if (score >= 70){
        return "C";
    } else if (score >=60){
        return "D";
    } else {
        return "F";
    }
}

function createIds(){
    dict = {};

    let id = 0;
    for ([index, assessment] of assessments.entries()){
        for([jndex, grade] of grades.entries()){
            dict[id++] = {[assessment.trim()]: grade};
        }
    }

    return dict;
}
function createGrades(){
    dict = {};

    let id = 0;
    for ([index, assessment] of assessments.entries()){
        dict[assessment.trim()] = {};
        for([jndex, grade] of grades.entries()){
            dict[assessment.trim()][grade] = {"id":id++, "count":0};
        }
    }

    return dict;
}

function createNodes(){
    nodes = [];
    
    let id = 0;
    for ([index, assessment] of assessments.entries()){
        for([jndex, grade] of grades.entries()){
            nodes.push({"id": id++});
        }
    }
    return nodes;
}

function createLinks(){
    /* links = [
        {"source": {"Exam 1": "A"}, "target": {"Exam 2": "A"}, "value": 0}, 
        ...
    ]
    */
    links = [];

    let assessment = 0;
    for ([index, assessment1] of assessments.entries()){ 
        let distance = 5;
        for ([jndex, grade1] of grades.entries()){
            for([kndex, grade2] of grades.entries()){
                if (index < 4){
                    links.push({"source": assessment, "target": assessment + distance + kndex, "value":0});
                }
            }
            assessment++;
            distance --; // looping through A, B, C, D, F moves the id closer to the next assessments id
        }
    }
    return links;
}
 
function formatSankeyData(data) {

    output = {
        "ids": createIds(),
        "grades": createGrades(),
        "nodes": createNodes(),
        "links": createLinks()
    }
    for (student in data){
        for ([index, assessment] of assessments.entries()){
            let grade = gradeScale(data[student][assessment]);
            if(grade == ""){
                continue;
            }
            output["grades"][assessment.trim()][grade]["count"]++;

            if (index < 4){
                let nextGrade = gradeScale(data[student][assessments[index+1]]);
                if(nextGrade == ""){
                    continue;
                }
                let source = output["grades"][assessment.trim()][grade]["id"];
                let target = output["grades"][assessments[index+1].trim()][gradeScale(data[student][assessments[index+1]])]["id"];
                for ([index, link] of output["links"].entries()){
                    if (JSON.stringify(link["source"]) == source && JSON.stringify(link["target"]) == target){
                        output["links"][index]["value"]++;
                    }
                }
            }   
        }
    }

    return output;
}

const data = formatSankeyData(rawData);
console.log(data);
const sankey = d3.sankey()
    .size([500, 500])
    .nodeId(d => d.id)
    .nodeWidth(20)
    .nodePadding(10)
    .nodeAlign(d3.sankeyCenter);
let graph = sankey(data);