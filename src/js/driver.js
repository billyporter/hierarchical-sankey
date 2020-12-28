
/** Driver Function */
populateGradeLevelMap();
const starterData = formatSankey()
const copyStarter = JSON.parse(JSON.stringify(starterData));
drawSankey(starterData);