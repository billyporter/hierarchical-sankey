/**
 * Returns an object of the following form:
 * [
 *      [ id, exam1, exam2, exam3, finalExam ],
 *      ...,
 *      [ id, exam1, exam2, exam3, finalExam ]
 * ]
 */
function formatParallelData() {
    return Object.entries(rawData).map(x => [x[0], x[1]['Exam 1'], x[1]['Exam 2'], x[1]['Exam 2'], x[1][' Final Exam']]);
}