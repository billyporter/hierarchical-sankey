/**
 * Returns array of pixel values for y-axis based on sankey  
 * */
function nodeValueToScale(examIndex, sankeyData) {
    const lowerBound = examIndex * 5;
    const upperBound = lowerBound + 5;
    const nodes = sankeyData['nodes'].slice(lowerBound, upperBound);
    const scaleArray = [];
    for (const node of nodes.reverse()) {
        scaleArray.push(node['y1']);
        scaleArray.push(node['y0']);
    }
    return scaleArray;
}

/**
 * Returns an object of the following form:
 * [
 *      { "id": id, "Exam 1": exam1_score, "Exam 2", exam2_score, 
 *      "Exam 3", exam3_score, "Final Exam": finalExam_score
 *       },
 *      ...,
 * ]
 */
function formatParallelData() {
    result = [];
    Object.entries(rawData)
        .map(x => result.push({
            "id": x[0], "Exam 1": x[1]["Exam 1"], "Exam 2": x[1]["Exam 2"], "Exam 3": x[1]["Exam 3"], "Final Exam": x[1][" Final Exam"]
        }));
    return result;
}

/*
* Takes in source node ID, target node ID,
* and returns list of corresponding datapoints
* in same format as formatParallelData()
*/
const pcData = formatParallelData();
const showLines = new Map(pcData.map(x => [x["id"], false])); // initialize map of id: False pairs (all lines should be hidden to start)


function filterParallelData(sourceGrade, targetGrade, sourceAssessment, targetAssessment) {

    /* Filter lines */
    const newData = pcData.filter(x => gradeScale(x[sourceAssessment.trim()]) === sourceGrade
        && gradeScale(x[targetAssessment.trim()]) === targetGrade)

    /**
     * Generate Groups
     */

    /* Switch from number to letter Grade */
    for (let line of newData) {
        for (let assessment of assessments) {
            line[assessment.trim()] = gradeScale(line[assessment.trim()]);
        }
    }

    /* Get groups and their sizes */
    let groupsMap = new Map();
    for (let line of newData) {
        let allExams = ''
        for (let assessment of assessments) {
            allExams += line[assessment.trim()];
        }
        line['concat'] = allExams;
        if (groupsMap.has(allExams)) {
            groupsMap.set(allExams, groupsMap.get(allExams) + 1);
        }
        else {
            groupsMap.set(allExams, 1);
        }
    }

    /* Rank the groups */
    let rankedArray = [];
    for (let group of groupsMap) {
        rankedArray.push(group);
    }
    let sortedArray = rankedArray.sort((a, b) => {
        return (a[1] < b[1]) ? 1 : -1;
    })

    /* Put rank and group into Map */
    let rankedMap = new Map();
    let i = 0
    for (let [group] of sortedArray) {
        rankedMap.set(group, i)
        i += 1
    }

    /* Add in color field to data */
    for (let line of newData) {
        line['group'] = rankedMap.get(line['concat']);
    }

    return newData;
}