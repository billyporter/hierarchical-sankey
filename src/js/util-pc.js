/**
 * Returns array of pixel values for y-axis based on sankey  
 * */
function nodeValueToScale(sankeyData, examName) {
    let lowerBound = 0;
    let upperBound = 0;
    starting = true
    for (const i of sankeyData["nodes"]) {
        if (i["assessment"].trim() === examName) {
            upperBound = i["id"] + 1;
            if (starting) {
                lowerBound = i["id"]
                starting = false
            }
        }
    }

    const nodes = sankeyData['nodes'].slice(lowerBound, upperBound);
    const scaleArray = [];
    for (const node of nodes.reverse()) {
        scaleArray.push(node['y1']);
        scaleArray.push(node['y0']);
    }
    return scaleArray;
}

/**
 * Returns array of domain values according to map
 */
function domainScale(nodes, examName) {
    const domain = [0, 59];
    let nodeCounter = 0;
    const nodesList = Object.entries(nodes).reverse();
    for (const [node, value] of nodesList) {
        if (node.localeCompare('F') !== 0 && node.localeCompare('0-59') !== 0) {
            /* Skip nodes accounted for by helper */
            const previousNode = nodesList[nodeCounter - 1][0];
            if (previousNode[previousNode.length - 1] !== '-' &&
                node[node.length - 1] !== '+'){

                /* Breakdown block */
                if (node[node.length - 1].localeCompare('-') === 0) {
                    domainScaleHelper(domain, node);
                }
                else {
                    domain.push(1 + domain[domain.length - 1]);
                    if (node.localeCompare('A') !== 0) {
                        domain.push(domain[domain.length - 1] + 9);
                    }
                    else {
                        domain.push(100);
                    }
                }
            }
        }
        nodeCounter += 1;
    }

    return domain;
}

/**
 * Helper to deal with C-, C, C+. etc.
 */
function domainScaleHelper(domain, node) {
    domain.push(1 + domain[domain.length - 1]);
    domain.push(domain[domain.length - 1] + 3);
    domain.push(1 + domain[domain.length - 1]);
    if (node.localeCompare('A-') !== 0) {
        domain.push(domain[domain.length - 1] + 2);
        domain.push(domain[domain.length - 1] + 1);
        domain.push(domain[domain.length - 1] + 2);
    }
    else {
        domain.push(100);
    }
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
    const newData = pcData.filter(x => {

        let sourceMatch = false
        const sourceRawLetter = gradeScale(x[sourceAssessment.trim()])


        if (!sourceRawLetter) {
            return false;
        }

        /* Check if source is broken down */
        if (assessGradeLevelMap[sourceAssessment][sourceRawLetter]["level"] === 1) {
            sourceMatch = specificLetterScale(sourceRawLetter, x[sourceAssessment.trim()]) === sourceGrade
        }
        else {
            sourceMatch = sourceRawLetter === sourceGrade
        }

        let targetMatch = false;
        let targetString = targetAssessment;
        if (targetAssessment === 'Final Exam') {
            targetString = ' '.concat(targetAssessment); // corrects for ' Final Exam' issue
        }
        /* Check if target is broken down */
        const targetRawLetter = gradeScale(x[targetAssessment.trim()])
        if (!targetRawLetter) {
            return false;
        }
        if (assessGradeLevelMap[targetString][targetRawLetter]["level"] === 1) {
            targetMatch = specificLetterScale(targetRawLetter, x[targetAssessment.trim()]) === targetGrade
        }
        else {
            targetMatch = targetRawLetter === targetGrade
        }

        return sourceMatch && targetMatch;
    });


    /**
     * Generate Groups
     */

    /* Switch from number to letter Grade */
    for (let line of newData) {
        for (let assessment of assessments) {
            const currGrade = gradeScale(line[assessment.trim()]);
            if (assessGradeLevelMap[assessment][currGrade]["level"] === 1) {
                line[assessment.trim() + ' letter'] = specificLetterScale(currGrade, line[assessment.trim()]);
            }
            else {
                line[assessment.trim() + ' letter'] = gradeScale(line[assessment.trim()]);
            }
        }
    }

    /* Get groups and their sizes */
    let groupsMap = new Map();
    for (let line of newData) {
        let allExams = ''
        for (let assessment of assessments) {
            allExams += line[assessment.trim() + ' letter'];
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

    return [newData, i, rankedArray];
}