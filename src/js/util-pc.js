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
function filterParallelData(sourceGrade, targetGrade, sourceAssessment, targetAssessment) {
    return pcData.filter( x => gradeScale(x[sourceAssessment.trim()]) === sourceGrade
                            && gradeScale(x[targetAssessment.trim()]) === targetGrade );
}