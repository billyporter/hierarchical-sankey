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

function createLinks(assessments){
    /* links = [
        {"source": {"Exam 1": "A"}, "target": {"Exam 2": "A"}, "value": 0}, 
        ...
    ]
    */
    links = []

    assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam", "Calculated Grade"];
    grades = ["A", "B", "C", "D", "F"]

    for ([index, assessment] of assessments.entries()){
        for ([jndex, grade1] of grades.entries()){
            for([kndex, grade2] of grades.entries()){
                if (index < 4){
                    links.push({"source": {[assessment.trim()]: grade1}, "target": {[assessments[index+1].trim()]: grade2}, "value":0});
                }
            }
        }
    }
    return links;
}
 
function formatSankeyData(data) {

    output = {
        "nodes": {
            "Exam 1": {},
            "Exam 2": {},
            "Exam 3": {},
            "Final Exam": {},
            "Calculated Grade": {} 
        },
        "links": createLinks()
    }

    assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam", "Calculated Grade"]
    for (student in data){
        for ([index, assessment] of assessments.entries()){
            grade = gradeScale(data[student][assessment]);
            if(grade == ""){
                continue;
            }
            loc = output["nodes"][assessment.trim()][grade] 
            if (loc){
                loc ++;
            } else {
                loc = 1;
            }
            output["nodes"][assessment.trim()][grade] = loc;

            if (index < 4){
                let source = JSON.stringify({[assessment.trim()]: grade});
                let target = JSON.stringify({[assessments[index+1].trim()]: gradeScale(data[student][assessments[index+1]])});
                for ([index, link] of output["links"].entries()){
                    if (JSON.stringify(link["source"]) == source && JSON.stringify(link["target"]) == target){
                        output["links"][index]["value"]++;
                    }
                }
            }   
        }
    }

    console.log(output);
    return output;
}

formatSankeyData(rawData);