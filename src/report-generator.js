/**
 * Convert array of objects to CSV format
 */
function convertToCSV(headers, rows) {
    const headerRow = headers.join(',');
    const dataRows = rows.map(row => 
        headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
}

/**
 * Generate all reports
 */
async function generateReports(analysis) {
    const reports = {};
    
    // 1. Analysis Report (Markdown)
    reports['analysis.md'] = generateAnalysisReport(analysis);
    
    // 2. Sprint Velocity CSV
    reports['sprint_velocity.csv'] = generateSprintVelocityCSV(analysis.bySprint);
    
    // 3. Epic Velocity CSV
    reports['epic_velocity.csv'] = generateEpicVelocityCSV(analysis.byEpic);
    
    // 4. Owner Performance CSV
    reports['owner_performance.csv'] = generateOwnerPerformanceCSV(analysis.byOwner);
    
    // 5. Ticket Type Analysis CSV
    reports['ticket_type_analysis.csv'] = generateTicketTypeCSV(analysis.byType, analysis.summary);
    
    return reports;
}

/**
 * Generate Markdown analysis report
 */
function generateAnalysisReport(analysis) {
    const {
        summary,
        byType,
        bySprint,
        byEpic,
        byOwner,
        bugs,
        cycleTimes
    } = analysis;

    const report = `# Engineering Health Dashboard Report

**Generated:** ${new Date().toLocaleString()}

---

## Executive Summary

This report provides a comprehensive analysis of team velocity, quality metrics, and team member performance across all sprints in the analysis period.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Tickets** | ${summary.totalTickets} |
| **Completed Tickets** | ${summary.totalCompleted} |
| **Completion Rate** | ${summary.completionRate}% |
| **Avg Cycle Time** | ${summary.avgCycleTime} days |
| **Median Cycle Time** | ${summary.medianCycleTime} days |
| **Cycle Time Q1 (25th percentile)** | ${summary.cycleTimeQ1} days |
| **Cycle Time Q3 (75th percentile)** | ${summary.cycleTimeQ3} days |
| **Total Bugs** | ${bugs.total} |
| **Bugs Closed** | ${bugs.completed} |
| **Bug Closure Rate** | ${bugs.closureRate}% |

---

## 1. Ticket Type Distribution

By type, the team completed:

| Type | Count | % of Total |
|------|-------|-----------|
${Object.entries(byType).map(([type, count]) => {
    const pct = ((count / summary.totalTickets) * 100).toFixed(1);
    return `| ${type.charAt(0).toUpperCase() + type.slice(1)} | ${count} | ${pct}% |`;
}).join('\n')}

**Analysis:** A healthy mix of feature development, bug fixes, and technical maintenance work indicates a balanced focus on delivery, stability, and system improvement.

---

## 2. Sprint Performance

### Velocity Trend

${bySprint.map(sprint => {
    return `- **${sprint.name}**: ${sprint.created} created, ${sprint.completed} completed (${sprint.completionRate}% completion)`;
}).join('\n')}

**Insights:**
- Average sprint size: ${(bySprint.reduce((sum, s) => sum + s.created, 0) / bySprint.length).toFixed(0)} tickets
- Highest velocity: ${Math.max(...bySprint.map(s => s.created))} tickets (${bySprint.find(s => s.created === Math.max(...bySprint.map(s => s.created))).name})
- Completion consistency: ${(bySprint.reduce((sum, s) => sum + parseFloat(s.completionRate), 0) / bySprint.length).toFixed(1)}% average completion rate

---

## 3. Epic Breakdown

### Completed Work by Epic

${byEpic.slice(0, 10).map((epic, idx) => {
    return `${idx + 1}. **${epic.name}**: ${epic.completed}/${epic.created} completed (${epic.completionRate}%)`;
}).join('\n')}

**Top Performers:**
- Epic with highest completion: **${byEpic[0].name}** (${byEpic[0].completed} completed)
- Lowest completion rate: **${byEpic[byEpic.length - 1].name}** (${byEpic[byEpic.length - 1].completionRate}%)

---

## 4. Team Member Performance

### Top Performers by Cycle Time Efficiency

${byOwner.slice(0, 10).map((owner, idx) => {
    return `${idx + 1}. **${owner.name}**: ${owner.avgCycleTime} days avg, ${owner.tickets} tickets (${owner.completionRate}% completion)`;
}).join('\n')}

**Analysis:**
- Fastest average cycle time: **${byOwner[0].name}** (${byOwner[0].avgCycleTime} days)
- Most tickets completed: **${byOwner.sort((a, b) => b.tickets - a.tickets)[0].name}** (${byOwner.sort((a, b) => b.tickets - a.tickets)[0].tickets} tickets)
- Overall team average: ${(byOwner.reduce((sum, o) => sum + o.avgCycleTime, 0) / byOwner.length).toFixed(1)} days

---

## 5. Quality Metrics

### Bug Analysis

- **Total Bugs**: ${bugs.total}
- **Bugs Closed**: ${bugs.completed}
- **Open Bugs**: ${bugs.total - bugs.completed}
- **Closure Rate**: ${bugs.closureRate}%

${bugs.closureRate >= 95 
    ? '✅ **Excellent bug closure rate** - Team is keeping bugs in check and maintaining high quality' 
    : bugs.closureRate >= 85 
    ? '⚠️ **Good bug closure rate** - Monitor for any patterns in open bugs' 
    : '⚠️ **Attention needed** - Bug closure rate is below target, consider prioritizing bug fixes'}

---

## 6. Cycle Time Analysis

### Distribution

- **Mean (Average)**: ${summary.avgCycleTime} days
- **Median**: ${summary.medianCycleTime} days
- **Lower Quartile (Q1)**: ${summary.cycleTimeQ1} days
- **Upper Quartile (Q3)**: ${summary.cycleTimeQ3} days
- **Interquartile Range**: ${summary.cycleTimeQ3 - summary.cycleTimeQ1} days

**Interpretation:**
- 50% of tickets are completed between ${summary.cycleTimeQ1} and ${summary.cycleTimeQ3} days
- The spread suggests some work items face more blockers or complexity than others
- Focus on reducing outliers and increasing consistency in the middle 50%

---

## 7. Recommendations

### High Priority

1. **Reduce Cycle Time Outliers**
   - Target cycle times above ${summary.cycleTimeQ3 * 1.5} days
   - Root cause analysis for tickets exceeding 2x median cycle time
   - Consider breaking down larger work items

2. **Maintain Bug Closure Rate**
   - Current rate of ${bugs.closureRate}% is strong
   - Continue prioritizing bug fixes in sprints

3. **Sprint Consistency**
   - Aim for consistent ${(bySprint.reduce((sum, s) => sum + s.created, 0) / bySprint.length).toFixed(0)} ± 10% ticket targets
   - Reduces planning variability

### Medium Priority

1. **Epic Prioritization**
   - Review low-completion epics for blockers
   - Consider splitting larger epics into phases

2. **Team Capacity Planning**
   - Align work distribution based on cycle time data
   - Consider pairing slower/newer team members with faster ones

### Process Improvements

- Weekly cycle time reviews for tickets exceeding median by 3x
- Sprint retrospectives focused on blockers
- Automated alerts for tickets approaching cycle time thresholds

---

## Conclusion

The team shows solid execution with ${summary.completionRate}% completion rate and ${bugs.closureRate}% bug closure. Focus areas are reducing cycle time variance and maintaining sprint consistency. Continue current practices while addressing the recommendations above.

---

*For interactive dashboards and detailed charts, view the generated HTML dashboard.*
`;

    return report;
}

/**
 * Generate Sprint Velocity CSV
 */
function generateSprintVelocityCSV(bySprint) {
    const headers = ['Sprint', 'Created', 'Completed', 'Completion Rate (%)'];
    const rows = bySprint.map(sprint => ({
        'Sprint': sprint.name,
        'Created': sprint.created,
        'Completed': sprint.completed,
        'Completion Rate (%)': sprint.completionRate
    }));
    return convertToCSV(headers, rows);
}

/**
 * Generate Epic Velocity CSV
 */
function generateEpicVelocityCSV(byEpic) {
    const headers = ['Epic', 'Created', 'Completed', 'Completion Rate (%)'];
    const rows = byEpic.map(epic => ({
        'Epic': epic.name,
        'Created': epic.created,
        'Completed': epic.completed,
        'Completion Rate (%)': epic.completionRate
    }));
    return convertToCSV(headers, rows);
}

/**
 * Generate Owner Performance CSV
 */
function generateOwnerPerformanceCSV(byOwner) {
    const headers = ['Owner', 'Avg Cycle Time (days)', 'Tickets', 'Completed', 'Completion Rate (%)'];
    const rows = byOwner.map(owner => ({
        'Owner': owner.name,
        'Avg Cycle Time (days)': owner.avgCycleTime,
        'Tickets': owner.tickets,
        'Completed': owner.completed,
        'Completion Rate (%)': owner.completionRate
    }));
    return convertToCSV(headers, rows);
}

/**
 * Generate Ticket Type Analysis CSV
 */
function generateTicketTypeCSV(byType, summary) {
    const headers = ['Type', 'Count', 'Percentage (%)'];
    const rows = Object.entries(byType).map(([type, count]) => ({
        'Type': type.charAt(0).toUpperCase() + type.slice(1),
        'Count': count,
        'Percentage (%)': ((count / summary.totalTickets) * 100).toFixed(1)
    }));
    return convertToCSV(headers, rows);
}

module.exports = { generateReports };
