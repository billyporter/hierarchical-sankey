function woody() {
    console.log('cozy\'s crazy fucked');
}


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










/*
 Ouput -> [height, height * x]
*/
function examToScale(examName, sankeyData, height, padding) {
    /* 
    'A' count -->  (height - 4 * padding) * percentage
    */
    const currExam = sankeyData['grades'][examName];
    const netHeight = height - 4 * padding;
    totalSum = Object.values(currExam).reduce((total, value) => {
        return total + value['count'];
    }, 0);
    pixelDict = {}
    for (const grade of Object.entries(currExam)) {
        const pixels = grade[1]['count'] / totalSum * netHeight;
        pixelDict[grade[0]] = pixels;
    }


    // Build Array
    scaleArray = [height];
    let i = 1;
    for (const grade of Object.entries(pixelDict).reverse()) {
        scaleArray.push(scaleArray[i - 1] - grade[1]);
        i += 1;
        if (grade[0] !== 'A') {
            scaleArray.push(scaleArray[i - 1] - padding);
            i += 1;
        }
    }
    return scaleArray;

}