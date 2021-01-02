
/**
 * Parallel Coordinates Section
 * 
 * 
 * 
 * 
 */

function drawPC(sankeyData) {
    /* Builds the custom y-Scale and x-scale */
    var y = {}
    dimensions = ["Exam 1", "Exam 2", "Exam 3", "Final Exam"];
    for (const examName of dimensions) {
        const domainyWainy = domainScale(sankeyData["grades"][examName], examName);
        const scaleyWaley = nodeValueToScale(sankeyData, examName);
        y[examName] = d3.scaleLinear()
            .domain(domainyWainy)
            .range(scaleyWaley)
    }
    x = d3.scalePoint()
        .range([nodeWdt, width])
        .padding(0)
        .domain(dimensions);

    /* 
        The path function take a row of the csv as input
        and return x and y coordinates of the line to draw for this raw.
    */
    function path(d) {
        return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
    }

    /* Draws Plot */
    svg
        .selectAll("yPath")
        .data(pcData)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "lines")
        .style("fill", "none")
        .style("stroke", "#69b3a2")
        .style("stroke-width", "1.5")
        .style("opacity", 0.6)
        .style("visibility", "hidden")
        .style("pointer-events", "visiblePainted")
        .on("mouseover", function (d, i) {
            d3.select(this)
                .style("stroke", "#000000")
                .style("stroke-width", "4")
                .style("opacity", 1.0);
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("stroke", "#69b3a2")
                .style("stroke-width", "1.5")
                .style("opacity", 0.6);
        });


    /**
     * Draws Axes
     */

    /* Create Map for grades */
    const gradeMap = new Map();
    gradeMap.set('A', 90);
    gradeMap.set('B', 80);
    gradeMap.set('C', 70);
    gradeMap.set('D', 60);
    gradeMap.set('F', 0);

    /**
     * Loop through nodes and draw axes
     */
    svg.selectAll('.node').each(function (d, i) {
        /* Variables */
        const data = [];
        let start = gradeMap.get(d["name"][0]);
        if (d["name"][d["name"].length - 1] === '+') {
            start += 7;
        }
        let assess = d.assessment;
        if (assess.localeCompare('Final Exam') === 0) {
            assess = ' '.concat(assess);
        }

        /* Calculate end */
        let end = start + 10;
        if (d.name === 'F') // consider that F scale is of size 60 whereas other grades are of size 10
            end += 50;
        if (d.name === 'A')
            end += 1;
        let inc = 1;

        if (gradeMap.has(d.name[0])) {
            if (assessGradeLevelMap[assess][d.name[0]]["level"] === 1) {
                if (d["name"][d["name"].length - 1] === '-') {
                    end = start + 4;
                }
                if (d["name"].length === 1) {
                    start += 4;
                    if (d["name"] === 'A') {
                        end = start + 7;
                    }
                    else {
                        end = start + 3;
                    }
                }
                if (d["name"][d["name"].length - 1] === '+') {
                    end = start + 3;
                }
            }
        }

        /* Change number of points depending on size, A-D */
        const size = d["y1"] - d["y0"];
        const points = end - start - 1;

        let gap = size / points;
        if (d.name === 'F') {
            gap *= 6;
        }

        let incs = [];

        if (points === 10) {
            incs = [2, 5, 10];
        } else if (points === 9) {
            incs = [3, 3, 9];
        } else if (points === 59) {
            incs = [59, 59, 59]
        } else if (points === 6) {
            incs = [2, 3, 6];
        } else if (points === 3) {
            incs = [3, 3, 3];
        } else {
            incs = [2, 2, 2];
        }

        if (gap > 15) {
            inc = 1;
        } else if (gap > 10) {
            inc = incs[0];
        } else if (gap > 5) {
            inc = incs[1];
        } else if (gap > 2.5) {
            inc = points;
        } else {
            start = end;
        }

        /* Case for F grade (multiplies by 6 to remain proportional with A-D)*/
        if (d.name === 'F') {
            if (inc != points) {
                inc *= 6;
            }
        }

        for (let i = start; i < end; i += inc) {
            data.push(i);
        }
        /* Create point scale */
        var scale = d3.scalePoint().domain(data).range([d["y1"], d["y0"]]);

        /* Add scale to axis */
        var y_axis = d3.axisRight().scale(scale);

        /* Append to svg */
        svg
            .append("g")
            .attr("transform", "translate(" + d["x1"] + ", 0)")
            .attr("class", "axes")
            .call(y_axis)
            .style("visibility", "hidden");
    });
}