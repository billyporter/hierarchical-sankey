function hierJS() {
    /*************************************
    * 
    * 
    * 
    *              Header
    * 
    * 
    ************************************** 
    */

    const margin = { top: 50, right: 50, bottom: 10, left: 10 }
    const width = 890 - margin.left - margin.right; //890;
    const height = 740 - margin.top - margin.bottom; //740;
    const legendWidth = 600;
    const legendHeight = 900;

    /* Sets up svg */
    const svg = d3.select("#canvas")
        .attr("width", width + margin.left + 50 + margin.right + 500)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(50, 30)");
    /*************************************
     * 
     * 
     * 
     *              Util-Sankey
     * 
     * 
     ************************************** 
     */


    /* Constants */
    const assessments = ["Exam 1", "Exam 2", "Exam 3", " Final Exam"];
    const grades = ["A", "B", "C", "D", "F"];

    const letrs = new Set(["A", "B", "C", "D", "F"]);
    const svgBackground = "#eff";
    const svgBorder = "1px solid #333";
    let padding = 45;
    const nodeWdt = 31;
    let deflineColor = "#90A4AE";
    let isActive = false;
    let activeLink = -1;
    const gradeCountDict = {};
    const sankeyColor = d3.scaleOrdinal()
        .domain(['A', 'B', 'C', 'D', 'F'])
        .range([d3.hsv(200, 0.8810, 0.8235), d3.hsv(138, 0.75, 0.64), d3.hsv(55, 0.75, 0.89), d3.hsv(38, 0.75, 0.9), d3.hsv(8, 0.75, 0.85)]);
    const assessGradeLevelMap = {};


    /* Gets color shade for + and - grades */
    function getShadePlusMinus(baseColor, sign) {
        color = d3.hsv(baseColor.h, baseColor.s, baseColor.v);
        if (sign == '-') {
            // 1/3 shade darker, maximum rgb value of 255
            color.s -= 0.25;
        } else if (sign == '+') {
            // 1/3 shade brighter
            color.s += 0.25;
        } else { // there is a bug if this case is reached
            return baseColor;
        }
        return color;
    }

    /* Gets color shade for number grades */
    function getShadeNumber(baseColor, name) {
        color = d3.hsv(baseColor.h, baseColor.s, baseColor.v);

        //special case for 100
        if (name == "100") {
            color.s += 0.5;
            return color;
        }

        n = parseInt(name[1]); //examine the 1's column of the node name to determine shade

        // special case for F
        if (isNaN(n))
            return color;

        color.s += 0.08 * (n - 5);

        return color;
    }

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

    /**
     * Populates grade level map
     * i.e. 
     * 0: A
     * 1: A, A-
     * 2: 90, 91, ..., 100
     */
    function populateGradeLevelMap() {
        let id = 0;
        for ([index, assessment] of assessments.entries()) {
            assessGradeLevelMap[assessment] = {};
            for ([jndex, grade] of grades.entries()) {
                assessGradeLevelMap[assessment][grade] = { "level": 0, "+": 0, "-": 0, "def": 0 };
            }
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
    function createIDS() {
        let id = 0;
        dict = {} // dict to hold ids
        for (const [index, assessment] of assessments.entries()) {
            for ([jndex, grade] of grades.entries()) {

                /* Curr level = level of breakdown (0 = no breakdown) */
                const currLevel = assessGradeLevelMap[assessment][grade]["level"];
                switch (currLevel) {
                    case 0:
                        dict[id++] = { [assessment.trim()]: grade };
                        break;
                    case 1:
                        if (grade !== 'F') {
                            if (grade !== 'A') {
                                dict[id++] = { [assessment.trim()]: grade.concat("+") };
                            }
                            dict[id++] = { [assessment.trim()]: grade };
                            dict[id++] = { [assessment.trim()]: grade.concat("-") };
                        }
                        else {
                            dict[id++] = { [assessment.trim()]: "0-59" };
                        }
                        break;
                    /* TODO: add case 2: (indiivual scores) */
                    case 2:
                        /* Keep nodes that aren't level 2 */
                        for (const subgrade of ["+", "def", "-"]) {
                            const lev = assessGradeLevelMap[assessment][grade][subgrade]
                            if (lev) {
                                /* Seen set so don't have repeat nodes, also memoize */
                                const seen = new Set();

                                /* numbersArray stores nodes that are filtered right */
                                const numbersArray = []
                                for (const student of Object.entries(rawData)) {
                                    if (!student[1][assessment]) {
                                        continue;
                                    }
                                    const currGrade = student[1][assessment];
                                    if (seen.has(currGrade)) {
                                        continue;
                                    }
                                    seen.add(currGrade);
                                    currGradeLevel = specificLetterScale(gradeScale(currGrade), currGrade);
                                    let suffix = subgrade;
                                    if (suffix.localeCompare("def") === 0) {
                                        suffix = "";
                                    }
                                    if (currGradeLevel === grade.concat(suffix)) {
                                        numbersArray.push(currGrade);
                                    }
                                }
                                for (const num of numbersArray.sort(function (a, b) { return parseInt(b) - parseInt(a) })) {
                                    dict[id++] = { [assessment.trim()]: num };
                                }
                            } /* Proceed as normal if not in second level */
                            else {
                                if (subgrade.localeCompare("+") === 0) {
                                    if (grade !== 'A' && grade !== 'F') {
                                        dict[id++] = { [assessment.trim()]: grade.concat(subgrade) };
                                    }
                                }
                                if (subgrade.localeCompare("-") === 0) {
                                    if (grade !== 'F') {
                                        dict[id++] = { [assessment.trim()]: grade.concat(subgrade) };
                                    }
                                }
                                if (subgrade.localeCompare("def") === 0) {
                                    dict[id++] = { [assessment.trim()]: grade };
                                }
                            }
                        }

                        break;
                }

            }
        }
        return dict;
    }

    /**
     * [
     *      {source: current_index, target: target_index, value: 0}
     * ]
     * 
     * formatSankeyData updates values
     * 
     */
    function createLinks(newIds) {

        links = [];
        let prevTop = 0; // top of previous column
        for (column = 0; column < assessments.length - 1; column++) {
            let firstColLength = 0;
            let secColLength = 0;

            /* Count length of columns based on expansion */
            for (const [key, value] of Object.entries(newIds)) {
                if (assessments[column] === Object.keys(value)[0]) {
                    firstColLength += 1;
                }
                if (assessments[column + 1].trim() === Object.keys(value)[0]) {
                    secColLength += 1;
                }
            }
            for (let first = 0; first < firstColLength; first++) {
                const currPosition = prevTop + first;
                for (second = 0; second < secColLength; second++) {
                    const targPosition = prevTop + firstColLength + second;
                    links.push({ "source": currPosition, "target": targPosition, "value": 0 });
                }
            }
            prevTop += firstColLength;
        }
        return links;
    }


    /**
     * [ {id: 0}, {id: 1}, ...]
     */
    function createNodes(newIds) {
        nodes = []
        for (const [key, value] of Object.entries(newIds)) {
            nodes.push({
                "id": parseInt(key),
                "name": Object.values(value)[0],
                "assessment": Object.keys(value)[0],
            });
        }
        return nodes
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
    function createGrades(newIds) {
        dict = {};
        for (const [key, value] of Object.entries(newIds)) {
            if (!dict[Object.keys(value)[0].trim()]) {
                dict[Object.keys(value)[0].trim()] = {}
            }
            dict[Object.keys(value)[0].trim()][Object.values(value)[0]] = {
                "id": parseInt(key),
                "count": 0
            }
        }
        return dict
    }

    /**
     * Function that updates values of the links
     * and combines each function into one ouput
     * object
     */
    function formatSankey() {
        newIds = createIDS();
        newLinks = createLinks(newIds);
        newNodes = createNodes(newIds);
        newGrades = createGrades(newIds);

        output = {
            "ids": newIds,
            "grades": newGrades,
            "nodes": newNodes,
            "links": newLinks
        }
        for (const student of Object.entries(rawData)) {
            for ([index, assessment] of assessments.entries()) {
                if (!student[1][assessment]) {
                    continue;
                }
                let grade = gradeScale(student[1][assessment]);
                let level = assessGradeLevelMap[assessment][grade]["level"];
                if (level === 1) {
                    grade = specificLetterScale(grade, student[1][assessment]);
                    if (grade.localeCompare('F') === 0) {
                        grade = "0-59";
                    }
                }
                if (level === 2) {
                    grade = specificLetterScale(grade, student[1][assessment]);
                    if (grade.length === 1 && assessGradeLevelMap[assessment][grade]["def"] === 2) {
                        grade = student[1][assessment];
                    }
                    else if (assessGradeLevelMap[assessment][grade[0]][grade[grade.length - 1]] === 2) {
                        grade = student[1][assessment];
                    }
                }
                output["grades"][assessment.trim()][grade]["count"]++;

                if (index < 3) {
                    let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                    let copyNextGrade = student[1][assessments[index + 1]];
                    if (nextGrade == "") {
                        continue;
                    }
                    let level = assessGradeLevelMap[assessments[index + 1]][nextGrade]["level"];
                    if (level === 1) {
                        nextGrade = specificLetterScale(nextGrade, student[1][assessments[index + 1]]);
                        if (nextGrade.localeCompare('F') === 0) {
                            nextGrade = "0-59";
                        }
                    }
                    if (level === 2) {
                        nextGrade = specificLetterScale(nextGrade, student[1][assessments[index + 1]]);
                        if (nextGrade.length === 1 && assessGradeLevelMap[assessments[index + 1]][nextGrade]["def"] === 2) {
                            nextGrade = copyNextGrade;
                        }
                        else if (assessGradeLevelMap[assessments[index + 1]][nextGrade[0]][nextGrade[nextGrade.length - 1]] === 2) {
                            nextGrade = copyNextGrade;
                        }
                    }
                    let source = output["grades"][assessment.trim()][grade]["id"]; // prev grade id
                    let target = output["grades"][assessments[index + 1].trim()]
                    [nextGrade]["id"]; // next grade id

                    for (const [index, link] of output["links"].entries()) {
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
     * 
     * 
     * 
     * Hierarchical Node
     * Exploratory Section
     * 
     * 
     * 
     */


    /**
     * Routes from click behavior to create new data
     * and updates level of clicked node
     * flag = true = breakdown
     * flag = false = build up
     */
    function hierarchSankeyRouter(node, flag) {
        const oldGraph = formatSankey();

        /* Update Ids */
        const locAs = node['assessment'];
        const locGrade = node['name'];

        /* Need to add space if final exam */
        let stringToInput = locAs;
        if (locAs.localeCompare('Final Exam') === 0)
            stringToInput = ' '.concat(locAs);

        /* Check if letter */
        let currLevel;
        let newLevel;
        if (letrs.has(locGrade[0])) {
            currLevel = assessGradeLevelMap[stringToInput][locGrade[0]]["level"]
            newLevel = currLevel + (flag ? 1 : -1 * currLevel);

            /* Keep new level in range 0-2 */
            newLevel = newLevel > 2 ? 2 : newLevel;

            assessGradeLevelMap[stringToInput][locGrade[0]]["level"] = newLevel;
            /* Expand to percentages if level of 2 */
            if (newLevel === 2) {
                if (locGrade.length > 1)
                    assessGradeLevelMap[stringToInput][locGrade[0]][locGrade[1]] = 2;
                else
                    assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 2;
            }
            else {
                assessGradeLevelMap[stringToInput][locGrade[0]]["+"] = 0;
                assessGradeLevelMap[stringToInput][locGrade[0]]["def"] = 0;
                assessGradeLevelMap[stringToInput][locGrade[0]]["-"] = 0;
            }
        }
        else if (!flag) {
            /* IF F set back to 0 */
            if (locGrade.localeCompare("0-59") === 0) {
                assessGradeLevelMap[stringToInput]["F"]["level"] = 0
            }
            /* If number, clear */
            else {
                const specLetter = specificLetterScale(gradeScale(locGrade), locGrade);
                if (specLetter.length > 1)
                    assessGradeLevelMap[stringToInput][specLetter[0]][specLetter[1]] = 0;
                else
                    assessGradeLevelMap[stringToInput][specLetter[0]]["def"] = 0;
            }
        }

        const newSankey = formatSankey();
        if (newLevel == undefined) {
            newLevel = -1;
        }
        removePlots();
        drawSankey(newSankey, false, flag, oldGraph, stringToInput, locGrade, newLevel);
    }

    /**
     * Function to remove svg
     */
    function removePlots() {
        d3.selectAll(".nodes").remove();
        d3.selectAll(".link").remove();
        d3.selectAll(".axes").remove();
        d3.selectAll(".lines").remove();
        d3.selectAll(".axis-label").remove();
    }

    /**
     * Takes in a graph and puts all points into
     * object
     */
    function populatePointStorageObj(graph) {
        for (const node of graph.nodes) {
            if (!(node.assessment in oldGraphPoints)) {
                oldGraphPoints[node.assessment] = {}
            }
            oldGraphPoints[node.assessment][node.name] =
            {
                "y0": node.y0,
                "y1": node.y1,
                "rectHeight": node.rectHeight,
                "value": node.value
            }
        }
    }

    /**
     * Takes in a new graph and stores points
     * in objects
     */
    function storeNewPoints(graph) {
        newGraphPoints = {};
        for (const node of graph.nodes) {
            if (!(node.assessment in newGraphPoints)) {
                newGraphPoints[node.assessment] = {}
            }
            newGraphPoints[node.assessment][node.name] =
            {
                "y0": node.y0,
                "y1": node.y1,
                "rectHeight": node.y1 - node.y0,
                "value": node.value,
                "id": node.id
            }
        }
    }

    /**
     * Checks to see which nodes are in the new graph
     * but are not in the old graph
     */
    function newNotInOld() {
        newNodes = new Set();
        for (const [examName, examValue] of Object.entries(newGraphPoints)) {
            for (const [gradeName, node] of Object.entries(examValue)) {
                if (!(gradeName in oldGraphPoints[examName])) {
                    newNodes.add([examName, gradeName, node.value].toString());
                }
                else if (node.value !== oldGraphPoints[examName][gradeName]["value"]) {
                    newNodes.add([examName, gradeName, node.value].toString());
                }
            }
        }
        return newNodes
    }

    /**
     * Checks to see which nodes are in old graph but
     * not in new graph
     */
    function oldNotInNew() {
        oldNodes = new Set();
        for (const [examName, examValue] of Object.entries(oldGraphPoints)) {
            for (const [gradeName, node] of Object.entries(examValue)) {
                if (!(gradeName in newGraphPoints[examName])) {
                    oldNodes.add([examName, gradeName, node.value].toString());
                }
                else if (node.value !== newGraphPoints[examName][gradeName]["value"]) {
                    oldNodes.add([examName, gradeName, node.value].toString());
                }
            }
        }
        return oldNodes
    }


    /**
     * Function to fill the old link storage
     * object with data
     */
    function populateLinkStorageObj(graph) {
        oldLinks = {};
        oldLinksMap = new Map();
        for (const link of graph.links) {
            const sourceA = link.source.assessment;
            const sourceG = link.source.name;
            const targetA = link.target.assessment;
            const targetG = link.target.name;

            if (!(sourceA in oldLinks))
                oldLinks[sourceA] = {}
            if (!(sourceG in oldLinks[sourceA]))
                oldLinks[sourceA][sourceG] = {}
            if (!(targetA in oldLinks[sourceA][sourceG]))
                oldLinks[sourceA][sourceG][targetA] = {}
            if (!(targetG in oldLinks[sourceA][sourceG][targetA]))
                oldLinks[sourceA][sourceG][targetA][targetG] = {}

            oldLinks[sourceA][sourceG][targetA][targetG] = {
                "y0": link.y0,
                "y1": link.y1,
                "width": link.width,
                "value": link.value
            }
            oldLinksMap.set([sourceA, sourceG, targetA, targetG].toString(), {
                "y0": link.y0,
                "y1": link.y1,
                "width": link.width,
                "value": link.value
            });

        }
    }

    /** 
     * Stores new links in a new links object
     */
    function storeNewLinks(graph) {
        newLinks = {};
        newLinksMap = new Map();
        for (const link of graph.links) {
            const sourceA = link.source.assessment;
            const sourceG = link.source.name;
            const targetA = link.target.assessment;
            const targetG = link.target.name;

            if (!(sourceA in newLinks))
                newLinks[sourceA] = {}
            if (!(sourceG in newLinks[sourceA]))
                newLinks[sourceA][sourceG] = {}
            if (!(targetA in newLinks[sourceA][sourceG]))
                newLinks[sourceA][sourceG][targetA] = {}
            if (!(targetG in newLinks[sourceA][sourceG][targetA]))
                newLinks[sourceA][sourceG][targetA][targetG] = {}

            newLinks[sourceA][sourceG][targetA][targetG] = {
                "y0": link.y0,
                "y1": link.y1,
                "width": link.width,
                "value": link.value
            }
            newLinksMap.set([sourceA, sourceG, targetA, targetG].toString(), {
                "y0": link.y0,
                "y1": link.y1,
                "width": link.width,
                "value": link.value
            });
        }
    }

    /**
     * Checks to see which links are in old graph 
     * that are not in new graph
     * @param {*} brokeExam --> broken down exam
     * @param {*} brokeGrade --> broken down grade
     */
    function oldLinkNotinNewSet(brokeExam, brokeGrade) {
        oldLinksSet = new Set();
        oldLinksObj = {};
        oldLinksObj['right'] = {}
        oldLinksObj['left'] = {}
        for (const key of oldLinksMap.keys()) {
            [first, firstG, sec, secG] = key.split(',');
            if (!newLinksMap.has(key)) {
                oldLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    oldLinksObj['right'][secG] = oldLinks[first][firstG][sec][secG]
                }
                else {
                    oldLinksObj['left'][firstG] = oldLinks[first][firstG][sec][secG]
                }
            }
            else if (newLinksMap.get(key).value !== oldLinksMap.get(key).value) {
                oldLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    oldLinksObj['right'][secG] = oldLinks[first][firstG][sec][secG]
                }
                else {
                    oldLinksObj['left'][firstG] = oldLinks[first][firstG][sec][secG]
                }
            }
            else if ((sec === brokeExam && secG === brokeGrade) || (first === brokeExam && firstG === brokeGrade)) {
                oldLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    oldLinksObj['right'][secG] = oldLinks[first][firstG][sec][secG]
                }
                else {
                    oldLinksObj['left'][firstG] = oldLinks[first][firstG][sec][secG]
                }
            }
        }
        return [oldLinksSet, oldLinksObj];
    }

    /**
     * Checks to see which links are in new graph 
     * that are not in old graph
     * @param {*} brokeExam --> broken down exam
     * @param {*} brokeGrade --> broken down grade
     */
    function newLinkNotinOldSet(brokeExam, brokeGrade, isBreakdown) {
        newLinksSet = new Set();
        newLinksObj = {}
        newLinksObj['right'] = {}
        newLinksObj['left'] = {}
        for (const key of newLinksMap.keys()) {
            [first, firstG, sec, secG] = key.split(',');
            if (!oldLinksMap.has(key)) {
                newLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
                }
                else {
                    newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
                }
            }
            else if (oldLinksMap.get(key).value !== newLinksMap.get(key).value) {
                newLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
                }
                else {
                    newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
                }
            }
            else if (!isBreakdown && (!isNumber(brokeGrade)) && ((sec === brokeExam && secG[0] === brokeGrade[0]) || (first === brokeExam && firstG[0] === brokeGrade[0]))) {
                newLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
                }
                else {
                    newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
                }
            }
            else if (!isBreakdown && (isNumber(brokeGrade)) && ((sec === brokeExam && secG === brokeGrade) || (first === brokeExam && firstG === brokeGrade))) {
                newLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
                }
                else {
                    newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
                }
            }
            else if (isBreakdown && (sec === brokeExam && secG === brokeGrade) || (first === brokeExam && firstG === brokeGrade)) {
                newLinksSet.add(key);
                if (brokeExam.localeCompare(first) === 0) {
                    newLinksObj['right'][secG] = newLinks[first][firstG][sec][secG]
                }
                else {
                    newLinksObj['left'][firstG] = newLinks[first][firstG][sec][secG]
                }
            }
        }
        return [newLinksSet, newLinksObj];
    }

    /**
     * Function to return the color for a node
     * based on its name
     */
    function getNodeColor(nodeName) {
        /* case for whole letter grade nodes */
        if (letrs.has(nodeName))
            return sankeyColor(nodeName);
        /* case for + and - grade nodes */
        if (letrs.has(nodeName[0]))
            return getShadePlusMinus(sankeyColor(nodeName[0]), nodeName[1]);
        /* case for number grade nodes */
        return getShadeNumber(sankeyColor(gradeScale(nodeName)), nodeName);
    }

    /**
     * Checks to see if a node name is a number
     */
    function isNumber(name) {
        return parseInt(name) >= 0 && parseInt(name) <= 100
    }

    /**
     * Function to variable set correct padding
     * based on number of nodes
     */
    function setNewPadding(sankeyData) {
        columnMap = new Map();
        for (const [key, value] of Object.entries(sankeyData.nodes)) {
            if (columnMap.has(value.assessment)) {
                columnMap.set(value.assessment, columnMap.get(value.assessment) + 1)
            }
            else {
                columnMap.set(value.assessment, 1);
            }
        }
        let highestValue = 0;
        for (let value of columnMap.values()) {
            if (highestValue < value) {
                highestValue = value
            }
        }
        if (highestValue > 16) {
            padding = 15;
        }
        else if (highestValue > 10) {
            padding = 25;
        }
        else {
            padding = 45;
        }
        sankey = d3.sankey()
            .size([width, height])
            .nodeId(d => d.id)
            .nodeWidth(nodeWdt)
            .nodePadding(padding)
            .nodeAlign(d3.sankeyCenter)
            .nodeSort(null);
    }
    /*************************************
     * 
     * 
     * 
     *              Sankey
     * 
     * 
     ************************************** 
     */

    /**
     * 
     * Nodes Section
     * 
     */


    var oldGraphPoints = {};
    var newGraphPoints = {};
    var oldLinks = {}
    var newLinks = {}
    var oldLinksMap = new Map();
    var newLinksMap = new Map();
    var graph;
    var oldGraph;
    var transitionDuration = 400;


    /* Creates Sankey Object */
    let sankey = d3.sankey()
        .size([width, height])
        .nodeId(d => d.id)
        .nodeWidth(nodeWdt)
        .nodePadding(padding)
        .nodeAlign(d3.sankeyCenter)
        .nodeSort(null);

    /**
     * Top level Sankey drawing function
     */
    function drawSankey(sankeyData, isFirst, isBreakdown, oldData, brokeExam, brokeGrade, newLevel) {

        /* Check for padding issues */
        setNewPadding(sankeyData);

        /* Keep copy of old graph for animation purposes */
        if (oldData) {
            oldGraph = sankey(oldData);
        }
        graph = sankey(sankeyData);


        /* If on load, add all points */
        if (isFirst) {
            populatePointStorageObj(graph);
            populateLinkStorageObj(graph);
            drawNodes(graph);
            drawLinks(graph);
        }


        /* Store new points and new links*/
        storeNewPoints(graph);
        storeNewLinks(graph);

        /* Get necessary objects */
        newPointsNotInOldSet = newNotInOld();
        oldPointsNotInNewSet = oldNotInNew();
        [oldLinkSet, oldLinksObj] = oldLinkNotinNewSet(brokeExam, brokeGrade);
        [newLinkSet, newLinksObj] = newLinkNotinOldSet(brokeExam, brokeGrade, isBreakdown);

        /**
         * Transition Updating
        */

        /* For case of breaking down */
        if (isBreakdown) {

            /* Set node values to old graph point to begin animation */
            for (const node of graph.nodes) {
                let visualNode;
                /* If node is a new node not in the old set, then it should be set to the value
                   of the only node that is in the old set but not the new set */
                if (newPointsNotInOldSet.has([node.assessment, node.name, node.value].toString())) {
                    const searchNode = oldPointsNotInNewSet.keys().next().value.split(',');
                    visualNode = oldGraphPoints[searchNode[0]][searchNode[1]];
                }
                else {
                    visualNode = oldGraphPoints[node.assessment][node.name];
                }
                node.y0 = visualNode.y0;
                node.y1 = visualNode.y1;
            }
            /* Set link value to old graph point to begin animation */
            for (const link of graph.links) {
                let visualLink;
                if (newLinkSet.has(
                    [link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                        .toString()
                )
                ) {
                    /* When breaking down, we want to set the multiple new links that form, 
                    * all to the point of the original
                    * node 
                    */
                    const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                    const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                    visualLink = oldLinksObj[direction][gradeToInput];
                }
                else {
                    visualLink = oldLinks[link.source.assessment][link.source.name][link.target.assessment][link.target.name];
                }
                link.y0 = visualLink.y0;
                link.y1 = visualLink.y1;
                link.width = visualLink.width;
            }
            /* First draw nodes and draw links according to these old values */
            drawNodes(graph);
            drawLinks(graph);

            /* Animate to the new values */
            transitionToNewBreakdown(sankeyData, newPointsNotInOldSet, oldPointsNotInNewSet, newLinkSet, brokeExam);
        }
        else if (!isFirst) {
            /* Handles case of building up */
            drawNodes(oldGraph);
            drawLinks(oldGraph);
            transitionToNewBuildup(newPointsNotInOldSet, oldPointsNotInNewSet, oldLinkSet, newLinkSet, newLinksObj, sankeyData, brokeExam, newLevel);
        }

        /* Store new points in old points */
        oldGraphPoints = JSON.parse(JSON.stringify(newGraphPoints));
        oldLinks = JSON.parse(JSON.stringify(newLinks));
        oldLinksMap = new Map(newLinksMap);
    }


    /**
     * 
     * Function to draw nodes of sankey
     */
    function drawNodes(graph) {

        function buildString(percentArray, value) {
            let maxIndex = percentArray.length;
            let outputString = '';
            for (const i in percentArray[0]) {
                nodeName = percentArray[0][i];
                totalCount = percentArray[1][i];
                outputString += parseFloat(value / totalCount * 100).toFixed(2) + "%";
                outputString += ` of parent node ${nodeName} </br>`;
            }
            return outputString;
        }

        function getAllStudents(exam, value) {
            let allCount = 0;
            for (const node of graph.nodes) {
                if (node.assessment === exam) {
                    allCount += node.value;
                }
            }
            return parseFloat(value / allCount * 100).toFixed(2) + "%";
        }

        function getParentPercentage(exam, grade, value) {
            const locAs = exam;
            const locGrade = grade;
            let stringToInput = locAs;
            if (locAs.localeCompare('Final Exam') === 0)
                stringToInput = ' '.concat(locAs);

            let parentNodeArray = [];
            let allowAll = true;

            /* Gen parent nodes */
            if (isNumber(grade)) {
                parentNodeArray.push(gradeScale(grade));
                parentNodeArray.push(specificLetterScale(gradeScale(grade), grade))
            }
            else {
                parentNodeArray.push(grade[0]);
            }

            countArray = []
            let index = 0
            for (const parNode of parentNodeArray) {
                let count = 0;
                for (const node of graph.nodes) {
                    if (node.assessment === exam) {
                        if (isNumber(node.name)) {
                            nodeName = gradeScale(node.name)
                            if (index === 1) {
                                nodeName = specificLetterScale(nodeName, node.name);
                            }
                            if (nodeName === parNode) {
                                count += node.value;
                            }
                        }
                        else {
                            if (node.name[0] === parNode) {
                                count += node.value;
                            }
                        }
                    }
                }
                countArray.push(count);
                index += 1
            }
            const returnList = [parentNodeArray, countArray];
            return returnList
        }

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        setLabels(graph);
        /* Creates Node */
        var graphnode = svg
            .append("g")
            .classed("nodes", true)
            .selectAll("rect")
            .data(graph.nodes)
            .enter()

        /* Draws Node */
        graphnode.append("rect")
            .attr("class", "node")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => (d.x1 - d.x0))
            .attr("height", d => {
                d.rectHeight = d.y1 - d.y0;
                return (d.y1 - d.y0)
            })
            .style("fill", (d) => {
                return getNodeColor(d.name)
            })
            .attr("stroke", (d) => {
                return d3.rgb(getNodeColor(d.name)).darker(0.6);
            })
            .on("click", function (d, i) {
                if (d.shiftKey) {
                    hierarchSankeyRouter(i, false);
                }
                else {
                    hierarchSankeyRouter(i, true);
                }
            })
            .on("contextmenu", function (d, i) {
                d.preventDefault();
                hierarchSankeyRouter(i, false);
            })
            .on("mouseover", function (d, i) {
                d3.selectAll('.tooltip').each(function (d) {
                    console.log(this);
                    d3.select(this).transition()
                        .duration(500)
                        .style('opacity', 0)
                        .remove();
                });

                const percent = getAllStudents(i.assessment, i.value);
                const childPercentArray = getParentPercentage(i.assessment, i.name, i.value);
                const htmlString = buildString(childPercentArray, i.value);
                const childPercent = childPercentArray[0];
                const parentNode = childPercentArray[1];
                div.transition()
                    .duration(400)
                    .style("opacity", 1.0);
                div.html(`Node ${i.assessment} ${i.name} </br>${i.value} students </br> ${htmlString} ${percent} of all students `)
                    .style("left", (d.pageX) + "px")
                    .style("top", (d.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


        /* Add in title */
        // graphnode.append("title")
        //     .text((d) => d.name + "\n" + " Students")


        /* Add in text */
        graphnode.append("text")
            .style("font-size", "16px")
            .attr("class", "nodeText")
            .attr("x", function (d) { return d.x0 - 30; })
            .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em")
            .text(function (d) { return d.name; });

    }



    /**
     * 
     * Links Section
     * 
     */

    /**
     * 
     * Function to draw Links of Sankey
     */
    var graphlink;
    function drawLinks(graph) {

        var div = d3.select("body").append("div")
            .attr("class", "tooltipLink")
            .style("opacity", 0);

        function buildString(percentArray, value) {
            let maxIndex = percentArray.length;
            let outputString = '';
            let index = 0;
            for (const i in percentArray[0]) {
                nodeName = percentArray[0][i];
                totalCount = percentArray[1][i];
                outputString += parseFloat(value / totalCount * 100).toFixed(2) + "%";
                if (index === 0) {
                    outputString += ` of source node ${nodeName} </br>`;
                }
                else {
                    outputString += ` of target node ${nodeName} </br>`;
                }
                index += 1;
            }
            return outputString;
        }

        function getAllStudents(exam, value) {
            let allCount = 0;
            for (const node of graph.nodes) {
                if (node.assessment === exam) {
                    allCount += node.value;
                }
            }
            return parseFloat(value / allCount * 100).toFixed(2) + "%";
        }

        function getParentPercentage(sourceIndex, sourceName, targetIndex, targetName) {

            sourceCount = 0;
            targetCount = 0;
            const parentNodeArray = [sourceName, targetName]
            for (const node of graph.nodes) {
                if (node.id === sourceIndex) {
                    sourceCount += node.value;
                }
                if (node.id === targetIndex) {
                    targetCount += node.value;
                }
            }
            const countArray = [sourceCount, targetCount];
            const returnList = [parentNodeArray, countArray];
            // console.log(returnList)
            return returnList
        }

        /* Creates Link */
        graphlink = svg
            .append("g")
            .attr("class", "links")
            .selectAll("path")
            .data(graph.links)
            .enter()
            .append("path")

        /* Draws Link */
        graphlink
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("fill", "none")
            .style("stroke-width", d => d.width)
            .style("stroke", d => {
                return getNodeColor(d.source.name);
            })
            .on("mouseover", function (d, i) {

                d3.selectAll('.tooltipLink').each(function (d) {
                    d3.select(this).transition()
                        .duration(500)
                        .style('opacity', 0)
                        .remove();
                });
                const percent = getAllStudents(i.target.assessment, i.value);
                const childPercentArray = getParentPercentage(i.source.id, i.source.name, i.target.id, i.target.name);
                const htmlString = buildString(childPercentArray, i.value);
                div.transition()
                    .duration(500)
                    .ease(d3.easeCircle)
                    .style("opacity", 1.0);
                div.html(`Link: ${i.source.name[0]} to ${i.target.name[0]} </br> ${i.value} students </br> ${htmlString} ${percent} of all students `)
                    .style("left", (d.pageX) + "px")
                    .style("top", (d.pageY - 28) + "px");

            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(400)
                    .style("opacity", 0);
            });

    }

    /**
     * Function to animate the transition from breaking down a node
     * 
     * @param {*} sankeyData --> Sankey Data
     * @param {*} newPointsNotInOldSet --> New nodes not in old set (ex. A+)
     * @param {*} oldPointsNotInNewSet --> Old nodes not in new set (ex. A [when breaking down A -> A, A+])
     * @param {*} newLinkSet --> new links not in old link set (ex. A+-B)
     * @param {*} brokeExam --> The exam being broken down
     */
    function transitionToNewBreakdown(sankeyData, newPointsNotInOldSet, oldPointsNotInNewSet, newLinkSet, brokeExam) {

        /**
         * Setup for nodes and links pre transition
         */

        /**
         * When we overlay multitple links on top of each other, it becomes a very dark link,
         * so we set opacity to 0 for all but one of the starting links (as when breaking a node down,
         * all the new links start on the old link)
         */
        const seen = {}
        seen['left'] = {}
        seen['right'] = {}
        graphlink
            .style("stroke-opacity", function (link) {
                if (newLinkSet.has(
                    [link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                        .toString()
                )
                ) {
                    const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                    const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                    if (gradeToInput in seen[direction]) {
                        return 0.0;
                    }
                    else {
                        seen[direction][gradeToInput] = true;
                    }
                }
                return 0.4;
            })
            /* Set the stroke color to the old link color*/
            .style("stroke", function (link) {
                if (newLinkSet.has([link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                    .toString()
                )) {
                    const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                    const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                    if (direction.localeCompare('left') === 0) {
                        return getNodeColor(link.source.name);
                    }
                    if (isNumber(link.source.name)) {
                        return getNodeColor(specificLetterScale(gradeScale(link.source.name), link.source.name));
                    }
                    return getNodeColor(link.source.name[0])
                }
                return getNodeColor(link.source.name);
            });

        /* Set the new nodes to the original color */
        d3.selectAll('.node').each(function (d) {
            d3.select(this)
                .style('fill', function (node) {
                    if (newPointsNotInOldSet.has([node.assessment, node.name, node.value].toString())) {
                        const searchNode = oldPointsNotInNewSet.keys().next().value.split(',');
                        return getNodeColor(searchNode[1]);
                    }
                    return getNodeColor(node.name);
                }).style("stroke", function (node) {
                    if (newPointsNotInOldSet.has([node.assessment, node.name, node.value].toString())) {
                        const searchNode = oldPointsNotInNewSet.keys().next().value.split(',');
                        return d3.rgb(getNodeColor(searchNode[1])).darker(0.6);
                    }
                    return d3.rgb(getNodeColor(node.name)).darker(0.6);
                })
        });

        /**
         * Animate Nodes
         */
        d3.selectAll('.node').each(function (d) {
            d3.select(this)
                .transition().duration(transitionDuration)
                .attr('y', function (n) {
                    n.y0 = newGraphPoints[n.assessment][n.name]["y0"];
                    n.y1 = newGraphPoints[n.assessment][n.name]["y1"];
                    n.rectHeight = n.y1 - n.y0;
                    return n.y0;
                })
                .attr('height', function (n) {
                    return n.rectHeight;
                })
                .style("fill", function (node) {
                    return getNodeColor(node.name);
                })
                .style("stroke", function (d) {
                    return d3.rgb(getNodeColor(d.name)).darker(0.6);
                })
        });
        d3.selectAll('.nodeText').each(function (d) {
            d3.select(this)
                .transition().duration(transitionDuration)
                .attr('y', function (n) {
                    return (n.y0 + n.y1) / 2;
                });
        });

        /**
         * Animate links
         */

        /* Set new link location */
        for (const link of graph.links) {
            let visualNode = newLinks[link.source.assessment][link.source.name][link.target.assessment][link.target.name];
            link.y0 = visualNode.y0;
            link.y1 = visualNode.y1;
            link.width = visualNode.width;
        }

        /* sofar and total control when to draw the new graph */
        let soFar = 0;
        const total = graphlink["_groups"][0].length;

        /* Animate link */
        graphlink.transition().duration(transitionDuration).attr('d', d3.sankeyLinkHorizontal()).style("stroke-opacity", 0.4).style("stroke-width", function (n) {
            return n.width;
        }).style("stroke", function (link) {
            return getNodeColor(link.source.name);
        }).on("end", function () {
            soFar += 1;
            if (soFar === total) {
                removePlots();
                drawNodes(graph);
                drawLinks(graph);;
            }
        });
    }

    /**
     * Function that animates transition when building up a node
     * 
     * @param {*} newPointsNotInOldSet --> New Nodes not in old Graph (ex. build up A+/A/A-, new node is A)
     * @param {*} oldPointsNotInNewSet --> Old Nodes not in new graph (ex., old is A+/A/A-)
     * @param {*} oldLinkSet --> Same but for links
     * @param {*} newLinkSet --> Same but for links
     * @param {*} newLinksObj --> new link set but in a different structure
     * @param {*} sankeyData --> sankey data
     * @param {*} brokeExam 
     */
    function transitionToNewBuildup(newPointsNotInOldSet, oldPointsNotInNewSet, oldLinkSet, newLinkSet, newLinksObj, sankeyData, brokeExam, newLevel) {

        /**
         * Animate nodes
         */
        d3.selectAll('.node').each(function (d) {
            d3.select(this)
                .transition().duration(transitionDuration)
                .attr('y', function (n) {
                    /* Set node to new point */
                    let visualNode;
                    if (oldPointsNotInNewSet.has([n.assessment, n.name, n.value].toString())) {
                        const searchNode = newPointsNotInOldSet.keys().next().value.split(',');
                        visualNode = newGraphPoints[searchNode[0]][searchNode[1]];
                    }
                    else {
                        visualNode = newGraphPoints[n.assessment][n.name]
                    }
                    n.y0 = visualNode.y0;
                    n.y1 = visualNode.y1;
                    n.rectHeight = n.y1 - n.y0;
                    return n.y0;
                })
                .attr('height', function (n) { // Node size
                    return n.rectHeight;
                })
                .style('fill', function (node) { // Node color
                    if (oldPointsNotInNewSet.has([node.assessment, node.name, node.value].toString())) {
                        const searchNode = newPointsNotInOldSet.keys().next().value.split(',');
                        return getNodeColor(searchNode[1]);
                    }
                    return getNodeColor(node.name);
                }).style("stroke", function (node) { // Node Stroke
                    if (oldPointsNotInNewSet.has([node.assessment, node.name, node.value].toString())) {
                        const searchNode = newPointsNotInOldSet.keys().next().value.split(',');
                        return d3.rgb(getNodeColor(searchNode[1])).darker(0.6);
                    }
                    return d3.rgb(getNodeColor(node.name)).darker(0.6);
                });
        });

        /* Animate node text */
        d3.selectAll('.nodeText').each(function (d) {
            d3.select(this)
                .transition().duration(transitionDuration)
                .attr('y', function (n) {
                    return (n.y0 + n.y1) / 2;
                });
        });

        /* Set links to new position */
        for (const link of oldGraph.links) {
            let visualLink;
            if (oldLinkSet.has([link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                .toString()
            )
            ) {
                const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                visualLink = newLinksObj[direction][gradeToInput]
            }
            else {
                visualLink = newLinks[link.source.assessment][link.source.name][link.target.assessment][link.target.name];
            }
            link.y0 = visualLink.y0;
            link.y1 = visualLink.y1;
            link.width = visualLink.width;
        }
        let soFar = 0;
        let total = graphlink["_groups"][0].length;
        const seen = {}
        seen['left'] = {}
        seen['right'] = {}
        graphlink.transition().duration(transitionDuration).attr('d', d3.sankeyLinkHorizontal()).style("stroke", function (link) {
            if (oldLinkSet.has([link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                .toString()
            )) {
                const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                if (direction.localeCompare('left') === 0) {
                    return getNodeColor(link.source.name);
                }
                if (isNumber(link.source.name) && newLevel === 0) {
                    return getNodeColor(gradeScale(link.source.name));
                }
                if (isNumber(link.source.name)) {
                    return getNodeColor(specificLetterScale(gradeScale(link.source.name), link.source.name));
                }
                return getNodeColor(link.source.name[0])
            }
            return getNodeColor(link.source.name);
        }).style("stroke-width", function (n) {
            return n.width;
        }).style("stroke-opacity", function (link) {
            if (oldLinkSet.has([link.source.assessment, link.source.name, link.target.assessment, link.target.name]
                .toString()
            )) {
                const direction = link.source.assessment.localeCompare(brokeExam) ? "left" : "right";
                const gradeToInput = direction.localeCompare("left") === 0 ? link.source.name : link.target.name;
                if (gradeToInput in seen[direction]) {
                    return 0.0;
                }
                else {
                    seen[direction][gradeToInput] = true;
                }
            }
            return 0.4;
        }).on("end", function () {
            soFar += 1;
            if (soFar === total) {
                removePlots();
                drawNodes(graph);
                drawLinks(graph);
            }
        });
    }
    /*************************************
     * 
     * 
     * 
     *              Graph
     * 
     * 
     ************************************** 
     */
    /* Creates title for the graph */
    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -15)
        .style("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "600")
        .text("Hierarchical Sankey Diagram");

    function setLabels(graph) {
        const examGraphLabel = [];
        let assessIndex = 0;
        for (const node of graph.nodes) {
            // console.log(node);
            if (node.assessment === assessments[assessIndex].trim()) {
                examGraphLabel.push((node.x0 + node.x1) / 2);
                assessIndex += 1;
            }
            if (assessIndex === assessments.length) {
                break;
            }
        }

        /* Adds x axis labels of pathway */
        svg.append("text")
            .attr("class", "axis-label")
            .attr("y", height + 25)
            .attr("x", examGraphLabel[0])
            .style("text-anchor", "middle")
            .text("Exam 1");

        svg.append("text")
            .attr("class", "axis-label")
            .attr("y", height + 25)
            .attr("x", examGraphLabel[1])
            .style("text-anchor", "middle")
            .text("Exam 2");

        svg.append("text")
            .attr("class", "axis-label")
            .attr("y", height + 25)
            .attr("x", examGraphLabel[2])
            .style("text-anchor", "middle")
            .text("Exam 3");

        svg.append("text")
            .attr("class", "axis-label")
            .attr("y", height + 25)
            .attr("x", examGraphLabel[3])
            .style("text-anchor", "middle")
            .text("Final Exam");
    }


    var button = svg.append("rect")
        .attr("x", width + 225)
        .attr("y", 0)
        .attr("width", 200)
        .attr("height", 50)
        .attr("class", "resetButton")
        .style("fill", "#DEDEDE")
        .style("stroke", "#000000")
        .style("stroke-width", "2")
        .style("fill-opacity", 0.7)
        .style("rx", "12")
        .style("ry", "12")
        .classed("button", true)
        .on("mouseover", function (d) {
            d3.select(this)
                .style("fill", "#a9a9a9")
                .style("fill-opacity", 0.7);
        })
        .on("mouseout", function (d) {
            d3.select(this)
                .style("fill", "#DEDEDE")
                .style("fill-opacity", 0.7);
        })
        .on("click", () => resetGraph());


    /* Adds reset button */
    svg.append("text")
        .attr("x", width + 300)
        .attr("y", 30)
        .classed("button", true)
        .text("Reset")
        .style("fill", "#000000")
        .style("font-weight", "bold")
        .style("opacity", 1.0)
        .on("mouseover", function (d) {
            d3.select(".resetButton")
                .style("fill", "#DEDEDE")
                .style("fill-opacity", 0.7);
        })
        .on("mouseout", function (d) {
            d3.select(".resetButton")
                .style("fill", "#000000")
                .style("fill-opacity", 0.0);
        })
        .on("click", () => resetGraph());
    /*************************************
     * 
     * 
     * 
     *              Driver
     * 
     * 
     ************************************** 
     */

    /** Driver Function */
    populateGradeLevelMap();
    const starterData = formatSankey()
    drawSankey(starterData, true);

    /* Reset Function */
    function resetGraph() {
        removePlots();
        populateGradeLevelMap();
        const starterData = formatSankey()
        drawSankey(starterData, true);
    }
}