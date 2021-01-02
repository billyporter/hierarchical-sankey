
/** Driver Function */
populateGradeLevelMap();
const starterData = formatSankey()
drawSankey(starterData);

/* Reset Function */
function resetGraph() {
    removePlots();
    populateGradeLevelMap();
    const starterData = formatSankey()
    drawSankey(starterData);
}