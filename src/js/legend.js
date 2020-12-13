
/**
 * Build Legend For plot
 */

function buildLegend() {
    const legendX = width + legendWidth / 2;
    svg.append("circle").attr("cx", legendX).attr("cy", 130).attr("r", 6).style("fill", "#69b3a2")
}
