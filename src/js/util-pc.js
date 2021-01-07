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
function domainScale(nodes, examName, gradeMap) {
    const domain = [0, 59];
    const nodesList = Object.entries(nodes).sort(function (a, b) {
        return b[1].id - a[1].id
    });
    for (const [node, value] of nodesList) {
        let isLetter = letrs.has(node[0])
        /* Check to see if letter */
        if (isLetter || node.localeCompare("0-59") === 0) {
            if (node.localeCompare('F') !== 0 && node.localeCompare('0-59') !== 0) {
                /* Get Level */
                if (examName.localeCompare("Final Exam") === 0) {
                    examName = " ".concat(examName);
                }
                const level = assessGradeLevelMap[examName][node[0]]["level"];

                /* Handle cases */
                if (level === 0) {
                    domain.push(gradeMap.get(node));
                    if (node.localeCompare("A") === 0) {
                        domain.push(domain[domain.length - 1] + 1 + 9);
                    }
                    else {
                        domain.push(domain[domain.length - 1] + 1 + 8);
                    }
                }
                else {
                    domainScaleHelper(domain, node, gradeMap);
                }
            }
        }
        else {
            /* Handle the case of number */
            domain.push(parseInt(node) - 0.5);
            domain.push(parseInt(node) + 0.5);
        }
    }
    return domain;
}

/**
 * Helper to deal with C-, C, C+. etc.
 */
function domainScaleHelper(domain, node, gradeMap) {
    const start = gradeMap.get(node[0]);
    if (node.length > 1) {
        if (node[1].localeCompare("-") === 0) {
            domain.push(start);
            domain.push(domain[domain.length - 1] + 1 + 2);
        }
        else {
            domain.push(start+7);
            domain.push(domain[domain.length - 1] + 1 + 1);
        }
    }
    else {
        domain.push(start + 4);
        if (node.localeCompare("A") === 0) {
            domain.push(domain[domain.length - 1] + 1 + 5);
        }
        else {
            domain.push(domain[domain.length - 1] + 1 + 1);
        }
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
        if (assessGradeLevelMap[sourceAssessment][sourceRawLetter]["level"] === 2) {
            const specificLetter = specificLetterScale(sourceRawLetter, x[sourceAssessment.trim()]);
            let letterMapper = "def";
            if (specificLetter.length > 1) {
                letterMapper = specificLetter[1];
            }
            if (assessGradeLevelMap[sourceAssessment][sourceRawLetter][letterMapper]) {
                sourceMatch = x[sourceAssessment.trim()] === sourceGrade;
            }
            else {
                sourceMatch = specificLetterScale(sourceRawLetter, x[sourceAssessment.trim()]) === sourceGrade
            }
        }
        else if (assessGradeLevelMap[sourceAssessment][sourceRawLetter]["level"] === 1) {
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
        if (assessGradeLevelMap[targetString][targetRawLetter]["level"] === 2) {
            const specificLetter = specificLetterScale(targetRawLetter, x[targetString.trim()]);
            let newMapper = "def";
            if (specificLetter.length > 1) {
                newMapper = specificLetter[1];
            }
            if (assessGradeLevelMap[targetString][targetRawLetter][newMapper]) {
                targetMatch = x[targetString.trim()] === targetGrade;
            }
            else {
                targetMatch = specificLetterScale(targetRawLetter, x[targetString.trim()]) === targetGrade
            }
        }
        else if (assessGradeLevelMap[targetString][targetRawLetter]["level"] === 1) {
            targetMatch = specificLetterScale(targetRawLetter, x[targetString.trim()]) === targetGrade
        }
        else {
            targetMatch = targetRawLetter === targetGrade
        }

        return sourceMatch && targetMatch;
    });


    /**
     * Generate Groups
     */

    /* Assign group */
    for (let line of newData) {
        for (let assessment of assessments) {
            /* Get level */
            const generalGrade = gradeScale(line[assessment.trim()]);
            const currLevel = assessGradeLevelMap[assessment][generalGrade]["level"];
            if (currLevel === 2) {
                const specGrade = specificLetterScale(line[assessment.trim()]);
                if (specGrade.length > 1) {
                    if (assessGradeLevelMap[assessment][generalGrade][specGrade[1]]) {
                        line[assessment.trim() + ' group'] = line[assessment.trim()];
                    }
                    else {
                        line[assessment.trim() + ' group'] = specGrade;
                    }
                }
                else if (assessGradeLevelMap[assessment][generalGrade]["def"]) {
                    line[assessment.trim() + ' group'] = line[assessment.trim()];
                }
                else {
                    line[assessment.trim() + ' group'] = specGrade;
                }
            }
            else if (currLevel === 1) {
                line[assessment.trim() + ' group'] = specificLetterScale(line[assessment.trim()]);
            }
            else {
                line[assessment.trim() + ' group'] = gradeScale(line[assessment.trim()]);
            }
        }
    }

    /* Get groups and their sizes */
    let groupsMap = new Map();
    for (let line of newData) {
        let allExams = ''
        for (let assessment of assessments.slice(0,-1)) {
            allExams += line[assessment.trim() + " group"];
            allExams += "\u2192";
        }
        allExams += line[assessments[assessments.length-1].trim() + " group"]; //add last element to string
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

    source_targets = [sourceGrade, targetGrade, sourceAssessment, targetAssessment];
    
    return [newData, i, rankedArray, source_targets];
}

/**
 * Generate a start and end value for the domain of any given grade beyond first level
 */
function startAndEnd(grade, level){
    const rangeScale = d3.scaleOrdinal()
    if(level > 0){
        rangeScale
            .domain(["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A"])
            .range([[0, 60], [60, 64], [64, 67], [67, 70], [70, 74], [74, 77], [77, 80], [80, 84], [84, 87], [87, 90], [90, 94], [94, 101]]);
    } else {
        rangeScale
            .domain(["F", "D", "C", "B", "A"])
            .range([[0, 60], [60, 70], [70, 80], [80, 90], [90, 10]])
    }
    return rangeScale(grade);
}
