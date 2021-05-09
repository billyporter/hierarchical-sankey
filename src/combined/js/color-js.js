function colorJS() {
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
    const deflineColor = "#90A4AE";
    let isActive = false;
    let activeLink = -1;
    const gradeCountDict = {};
    const sankeyColor = d3.scaleOrdinal()
        .domain(['A', 'B', 'C', 'D', 'F'])
        .range([d3.hsv(178, 0.75, 0.67), d3.hsv(138, 0.75, 0.64), d3.hsv(55, 0.75, 0.89), d3.hsv(38, 0.75, 0.9), d3.hsv(8, 0.75, 0.85)]);
    const assessGradeLevelMap = {};
    const nodeHistoryMap = {};

    /* converts from hex color code to rgb color code struct */
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /* converts from rgb color code struct to hex color code */
    function rgbToHex(rgb) {
        hex = rgb.r.toString(16);
        r = hex.length == 1 ? "0" + hex : hex;
        hex = rgb.g.toString(16);
        g = hex.length == 1 ? "0" + hex : hex;
        hex = rgb.b.toString(16);
        b = hex.length == 1 ? "0" + hex : hex;
        return "#" + r + g + b;
    }

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
            assessGradeLevelMap[assessment.trim()] = {};
            for ([jndex, grade] of grades.entries()) {
                assessGradeLevelMap[assessment.trim()][grade] = 0;
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
                dict[id++] = { [assessment.trim()]: grade };
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
                    let sourceName = grades[first];
                    let sourceExam = assessments[column];
                    let targetName = grades[second];
                    let targetExam = assessments[column + 1].trim();
                    if (assessGradeLevelMap[sourceExam][sourceName] === 1) {
                        for (const grade of grades) {
                            links.push({ "source": currPosition, "target": targPosition, "value": 0, "sourceName": grade });
                        }
                    }
                    else {
                        links.push({ "source": currPosition, "target": targPosition, "value": 0 });
                    }
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
            const currExam = Object.keys(value)[0].trim()
            const currGrade = Object.values(value)[0]
            dict[currExam][currGrade] = {
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
                let sourceNodeName = grade;
                let sourceLevel = assessGradeLevelMap[assessment.trim()][grade];
                output["grades"][assessment.trim()][sourceNodeName]["count"]++;

                if (index < 3) {
                    let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                    if (nextGrade == "") {
                        continue;
                    }
                    let targetNodeName = nextGrade

                    let source = output["grades"][assessment.trim()][sourceNodeName]["id"]; // prev grade id
                    let target = output["grades"][assessments[index + 1].trim()]
                    [targetNodeName]["id"]; // next grade id
                    for (const [ind, link] of output["links"].entries()) {
                        if (sourceLevel === 1) {
                            let previousGrade = gradeScale(student[1][assessments[index - 1]]);
                            if (previousGrade == "") {
                                continue;
                            }
                            if (link["source"] == source && link["target"] == target) {
                                if (link["sourceName"] === previousGrade) {
                                    output["links"][ind]["value"]++;
                                }
                            }
                        }
                        else if (link["source"] == source && link["target"] == target) {
                            output["links"][ind]["value"]++;
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
     * History Node
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
        // populateNodeHistoryMap(node);
        const oldGraph = formatSankey();

        /* Update Ids */
        const locAs = node['assessment'];
        const locGrade = node['name'][0];

        if (locAs.localeCompare('Exam 1') !== 0 && locAs.localeCompare('Final Exam') !== 0) {
            if (flag) {
                assessGradeLevelMap[locAs][locGrade] = 1
            }
            else {
                assessGradeLevelMap[locAs][locGrade] = 0
            }
            const newSankey = formatSankey();
            removePlots();
            /* Need to add space if final exam */
            let stringToInput = locAs;
            if (locAs.localeCompare('Final Exam') === 0)
                stringToInput = ' '.concat(locAs);
            drawSankey(newSankey, false, flag, oldGraph, stringToInput, locGrade);
        }
    }


    function populateNodeHistoryMap(node) {
        for (const student of Object.entries(rawData)) {
            for ([index, assessment] of assessments.entries()) {
                if (!student[1][assessment]) {
                    continue;
                }
                let grade = gradeScale(student[1][assessment]);
                let sourceNodeName = grade;

                if (index < 3) {
                    let nextGrade = gradeScale(student[1][assessments[index + 1]]);
                    if (nextGrade == "") {
                        continue;
                    }
                    let targetNodeName = nextGrade

                    let source = output["grades"][assessment.trim()][sourceNodeName]["id"]; // prev grade id
                    let target = output["grades"][assessments[index + 1].trim()]
                    [targetNodeName]["id"]; // next grade id

                    /* If destination is curr node, find out where it goes next */
                    if (target === node.id) {
                        let nextTarget = gradeScale(student[1][assessments[index + 2]]);
                        if (nextTarget == "") {
                            continue;
                        }
                        if (!nodeHistoryMap[nextTarget]) {
                            nodeHistoryMap[nextTarget] = {}
                        }
                        if (!nodeHistoryMap[nextTarget][sourceNodeName]) {
                            nodeHistoryMap[nextTarget][sourceNodeName] = 1;
                        }
                        nodeHistoryMap[nextTarget][sourceNodeName]++;
                    }
                }
            }
        }
    }


    /**
     * Function to remove svg
     */
    function removePlots() {
        d3.selectAll(".nodes").remove();
        d3.selectAll(".link").remove();
        d3.selectAll(".axis-label").remove();
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
            padding = 20;
        }
        else if (highestValue > 10) {
            padding = 30;
        }
        else {
            padding = 40;
        }
        sankey = d3.sankey()
            .size([width, height])
            .nodeId(d => d.id)
            .nodeWidth(nodeWdt)
            .nodePadding(padding)
            .nodeAlign(d3.sankeyCenter)
            .nodeSort(null);
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
            // console.log(key);
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
     * Checks to see if a node name is a number
     */
    function isNumber(name) {
        return parseInt(name) >= 0 && parseInt(name) <= 100
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

    /* New for coloring */
    var oldGraphLinks = {};

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
    function drawSankey(sankeyData, isFirst, isBreakdown, oldData, brokeExam, brokeGrade) {

        /* Keep copy of old graph for animation purposes */
        if (oldData) {
            oldGraph = sankey(oldData);
        }


        graph = sankey(sankeyData);



        if (isFirst) {
            populateLinkStorageObj(graph);
            drawNodes(graph);
            drawLinks(graph);
        }

        /* Store new points and new links*/
        storeNewLinks(graph);


        [oldLinkSet, oldLinksObj] = oldLinkNotinNewSet(brokeExam, brokeGrade);
        [newLinkSet, newLinksObj] = newLinkNotinOldSet(brokeExam, brokeGrade, isBreakdown);

        if (isBreakdown) {
            oldGraphLinks = {};
            for (const link of oldGraph.links) {
                const linkLevel = assessGradeLevelMap[link.source.assessment][link.source.name];
                if (linkLevel === 1) {
                    oldGraphLinks[link.target.name] = { "y0": link.y0, "y1": link.y1, "width": link.width, "totalWidth": 0 };
                }
            }
            let totalWidth = 0;
            for (const link of graph.links) {
                if (link["sourceName"]) {
                    oldGraphLinks[link.target.name]["totalWidth"] += link.width;
                }
            }
            drawNodes(graph,);
            drawLinks(graph, newLinkSet, brokeExam, brokeGrade, isBreakdown);

            /* Animate to the new values */
            transitionToNewBreakdown();
        }
        else if (!isFirst) {
            drawNodes(graph);
            drawLinks(oldGraph, newLinkSet, brokeExam, brokeGrade, isBreakdown);
            transitionToNewBuildup(oldLinkSet, newLinkSet, newLinksObj, brokeExam, brokeGrade)
        }
        oldLinks = JSON.parse(JSON.stringify(newLinks));
        oldLinksMap = new Map(newLinksMap);
    }


    /**
     * 
     * Function to draw nodes of sankey
     */
    function drawNodes(graph) {
        setLabels(graph);

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
            console.log(exam, grade, value);
            const locGrade = grade[0];
            const level = assessGradeLevelMap[locAs.trim()][locGrade];
            if (level === 0) {
                return parseFloat(100).toFixed(2) + "%";
            }
            let count = 0;
            for (const node of graph.nodes) {
                console.log(node.assessment, node.name[0], node.value)
                if (node.assessment === exam && node.name[0] === grade[0]) {
                    count += node.value
                }
            }
            return parseFloat(value / count * 100).toFixed(2) + "%";
        }

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

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
                return sankeyColor(d.name[0])
            })
            .attr("stroke", (d) => {
                return d3.rgb(sankeyColor(d.name[0])).darker(0.6);
            })
            .on("click", function (d, i) {
                if (d.shiftKey && assessGradeLevelMap[i['assessment']][i['name'][0]] === 1) {
                    hierarchSankeyRouter(i, false);
                }
                else if (assessGradeLevelMap[i['assessment']][i['name'][0]] === 0) {
                    hierarchSankeyRouter(i, true);
                }
            })
            .on("mouseover", function (i, d) {

                /* Tooltip */
                d3.selectAll('.tooltip').each(function (d) {
                    console.log(this);
                    d3.select(this).transition()
                        .duration(500)
                        .style('opacity', 0)
                        .remove();
                });

                const percent = getAllStudents(d.assessment, d.value);
                const childPercent = getParentPercentage(d.assessment, d.name, d.value);
                div.transition()
                    .duration(400)
                    .style("opacity", 1.0);
                div.html(`${d.value} students </br> ${childPercent} of parent node </br> ${percent} of all students `)
                    .style("left", (i.pageX) + "px")
                    .style("top", (i.pageY - 28) + "px");

                /* Function */
                d3.selectAll(".link").style("stroke-opacity", function (link) {

                    const dIndex = assessments.indexOf(d.assessment);
                    const aIndex = assessments.indexOf(link.source.assessment);
                    if (link.source.name === d.name && link.source.assessment === d.assessment) {
                        return 0.9;
                    }
                    else if (assessGradeLevelMap[link.source.assessment.trim()][link.source.name] === 1
                        && dIndex < aIndex
                        && (aIndex - dIndex === 1 || assessGradeLevelMap[assessments[aIndex - 1]][d.name] === 1)
                        && (link.sourceName === d.name)) {
                        return 0.9;
                    }
                    else {
                        return 0.4;
                    }
                });
            })
            .on("mouseout", () => {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);

                d3.selectAll(".link").style("stroke-opacity", function (link) {
                    return 0.4;
                });
            })
            .on("contextmenu", function (d, i) {
                d.preventDefault();
                if (assessGradeLevelMap[i['assessment']][i['name'][0]] === 1) {
                    hierarchSankeyRouter(i, false);
                }
            });

        /* Add in text */
        graphnode.append("text")
            .style("font-size", "16px")
            .attr("class", "nodeText")
            .attr("x", function (d) { return d.x0 - 30; })
            .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em")
            .text(function (d) { return d.name[0]; });

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
    function drawLinks(graph, newLinkSet, brokeExam, brokeGrade, isBreakdown) {

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
            .attr("stop-opacity", 0.5)
            .style("stroke-width", d => d.width)
            .style("stroke", d => {
                const key = `${d.source.assessment},${d.source.name},${d.target.assessment},${d.target.name}`;
                if (newLinkSet && newLinkSet.has(key) && d.source.assessment === brokeExam && d.source.name === brokeGrade) {
                    if (isBreakdown) {
                        return sankeyColor(d.source.name[0]);
                    }
                    return sankeyColor(d.sourceName);
                }
                else if (newLinkSet && d.sourceName) {
                    return sankeyColor(d.sourceName);
                }
                return sankeyColor(d.source.name[0]);
            });
    }

    /**
     * Function to animate the transition from breaking down a node
     */
    function transitionToNewBreakdown() {

        /* Animate link */
        graphlink
            .transition()
            .ease(d3.easeCubic)
            .duration(transitionDuration + 500)
            .style("stroke", function (d) {
                if (d.sourceName) {
                    return sankeyColor(d.sourceName);
                }
                return sankeyColor(d.source.name[0]);
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
    function transitionToNewBuildup(oldLinkSet, newLinkSet, newLinksObj, brokeExam, brokeGrade) {

        let soFar = 0;
        let total = graphlink["_groups"][0].length;
        /* Draws Link */
        graphlink
            .transition()
            .ease(d3.easeCubic)
            .duration(transitionDuration + 500)
            .style("stroke", d => {
                const key = `${d.source.assessment},${d.source.name},${d.target.assessment},${d.target.name}`;
                if (newLinkSet && newLinkSet.has(key) && d.source.assessment === brokeExam && d.source.name === brokeGrade) {
                    return sankeyColor(d.source.name[0]);
                }
                else if (newLinkSet && d.sourceName) {
                    return sankeyColor(d.sourceName);
                }
                return sankeyColor(d.source.name[0]);
            }).on("end", function () {
                soFar += 1;
                if (soFar === total) {
                    removePlots();
                    drawNodes(graph);
                    drawLinks(graph, newLinkSet);
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

    /* Adds x axis labels of pathway */
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