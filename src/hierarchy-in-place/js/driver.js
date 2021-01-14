
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