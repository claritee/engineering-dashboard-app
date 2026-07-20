/**
 * Generate dashboard HTML from analysis data
 */
function generateDashboardHTML(analysis) {
    const {
        summary,
        byType,
        bySprint,
        byEpic,
        byOwner,
        bugs,
        allTickets
    } = analysis;

    // Generate scatter plot data
    const scatterDatasets = generateScatterData(byOwner, allTickets);

    // Generate overall cycle time stats for reference lines
    const trendStats = computeOverallCycleStats(allTickets);

    // Generate per-epic weekly ticket data
    const epicWeeklyData = computeEpicWeeklyData(allTickets);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Engineering Health Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 1800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 700; }
        .header p { font-size: 1.1em; opacity: 0.9; margin-bottom: 5px; }
        .timestamp { font-size: 0.9em; opacity: 0.8; font-style: italic; }
        .controls {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            align-items: center;
        }
        .control-group { display: flex; gap: 10px; align-items: center; }
        .control-group label { font-weight: 600; color: #495057; font-size: 0.9em; }
        select, input { padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 0.9em; background: white; cursor: pointer; }
        button { padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.3s; }
        button:hover { background: #764ba2; }
        .content { padding: 30px; }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .metric-card h3 { font-size: 0.85em; opacity: 0.9; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; }
        .metric-value { font-size: 2em; font-weight: 700; }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        .chart-container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
        }
        .chart-container h3 { margin-bottom: 15px; color: #333; font-size: 1.2em; }
        .chart-wrapper { position: relative; height: 400px; margin-bottom: 10px; }
        .chart-wrapper-scatter { position: relative; height: 500px; margin-bottom: 10px; }
        .chart-description { font-size: 0.85em; color: #666; margin-top: 10px; line-height: 1.4; }
        .legend-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .legend-item { display: flex; align-items: center; gap: 10px; font-size: 0.9em; }
        .legend-color { width: 12px; height: 12px; border-radius: 2px; }
        .tables-grid { display: grid; gap: 30px; }
        .table-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
        }
        .table-section h3 { margin-bottom: 15px; color: #333; font-size: 1.2em; }
        .table-section h3.collapsible { cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
        .table-section h3.collapsible::after { content: '▲'; font-size: 0.7em; color: #888; transition: transform 0.2s; }
        .table-section h3.collapsible.collapsed::after { transform: rotate(180deg); }
        .table-collapsible-body { overflow: hidden; transition: max-height 0.25s ease, margin-top 0.25s ease; max-height: 2000px; margin-top: 15px; }
        .table-collapsible-body.collapsed { max-height: 0; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; }
        th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        td { padding: 12px; border-bottom: 1px solid #dee2e6; }
        tr:hover { background: #f0f0f0; }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
            color: white;
        }
        .badge.feature { background: #667eea; }
        .badge.completed { background: #00b894; }
        .badge.bug { background: #d63031; }
        .badge.medium { background: #74b9ff; }
        .footer {
            background: #f8f9fa;
            padding: 15px 30px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 0.85em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Engineering Health Dashboard</h1>
            <p>Sprint Performance Analytics</p>
            <p class="timestamp">Generated: <span id="timestamp"></span></p>
        </div>
        
        <div class="controls">
            <div class="control-group">
                <label for="sprint-filter">Filter by Sprint:</label>
                <select id="sprint-filter" onchange="applyFilters()">
                    <option value="">All Sprints</option>
                </select>
            </div>
            <div class="control-group">
                <label for="exclude-members">Exclude Members:</label>
                <input type="text" id="exclude-members" placeholder="e.g. alice, bob@company.com" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; min-width: 240px;" />
            </div>
            <button onclick="resetFilters()">Reset Filters</button>
        </div>
        
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Tickets</h3>
                    <div class="metric-value">${summary.totalTickets}</div>
                </div>
                <div class="metric-card">
                    <h3>Completion Rate</h3>
                    <div class="metric-value">${summary.completionRate}%</div>
                </div>
                <div class="metric-card">
                    <h3>Avg Cycle Time</h3>
                    <div class="metric-value">${summary.avgCycleTime} days</div>
                </div>
                <div class="metric-card">
                    <h3>Median Cycle Time</h3>
                    <div class="metric-value">${summary.medianCycleTime} days</div>
                </div>
                <div class="metric-card">
                    <h3>Median Cycle Time (Last 2 weeks)</h3>
                    <div class="metric-value" id="metric-median-2weeks">-</div>
                </div>
                <div class="metric-card">
                    <h3>Bug Closure Rate</h3>
                    <div class="metric-value">${bugs.closureRate}%</div>
                </div>
                <div class="metric-card">
                    <h3>Completed</h3>
                    <div class="metric-value">${summary.totalCompleted}</div>
                </div>
                <div class="metric-card">
                    <h3>Median Cycle Time</h3>
                    <div class="metric-value">${summary.medianCycleTime} days</div>
                </div>
                <div class="metric-card">
                    <h3>Total Bugs</h3>
                    <div class="metric-value">${bugs.total}</div>
                </div>
                <div class="metric-card">
                    <h3>Bugs Closed</h3>
                    <div class="metric-value">${bugs.completed}</div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>📦 Story Type Distribution</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-story-type"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>🎯 Epics Completed (Pie Chart)</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-epic-pie"></canvas>
                    </div>
                </div>

                <div class="chart-container">
                    <h3>🗂️ Tickets by Epic Category</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-epic-category"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container" style="grid-column: 1 / -1;">
                    <h3>📈 Cycle Time Trends by Team Member</h3>
                    <div class="chart-wrapper-scatter">
                        <canvas id="chart-scatter-cycle-time"></canvas>
                    </div>
                    <div class="chart-description">
                        <strong>Scatter plot showing cycle time for each team member across sprints.</strong> Trend lines show Mean, Median, and Quartiles (Q1, Q3).
                    </div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>🏃 Velocity Chart</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-velocity"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>🐛 Bug Trends</h3>
                    <div class="chart-wrapper">
                        <canvas id="chart-bugs"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="tables-grid">
                <div class="table-section">
                    <h3 class="collapsible collapsed" onclick="toggleTable(this, 'body-epics')">🎯 Velocity by Epic</h3>
                    <div id="body-epics" class="table-collapsible-body collapsed">
                        <table>
                            <thead>
                                <tr>
                                    <th>Epic</th>
                                    <th>Created</th>
                                    <th>Completed</th>
                                    <th>Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody id="table-epics">
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="table-section">
                    <h3 class="collapsible collapsed" onclick="toggleTable(this, 'body-sprints')">🏃 Velocity by Sprint</h3>
                    <div id="body-sprints" class="table-collapsible-body collapsed">
                        <table>
                            <thead>
                                <tr>
                                    <th>Sprint</th>
                                    <th>Created</th>
                                    <th>Completed</th>
                                    <th>Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody id="table-sprints">
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="table-section">
                    <h3 class="collapsible collapsed" onclick="toggleEpicWeekly(this)">📅 Weekly Tickets: Created vs Completed by Epic</h3>
                    <div id="section-epic-weekly" class="table-collapsible-body collapsed">
                        <div style="margin-bottom: 16px;">
                            <label for="epic-weekly-select" style="font-weight: 600; margin-right: 10px;">Epic:</label>
                            <select id="epic-weekly-select" onchange="renderEpicWeeklyChart()" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"></select>
                        </div>
                        <div class="chart-wrapper" style="height: 400px;">
                            <canvas id="chart-epic-weekly"></canvas>
                        </div>
                    </div>
                </div>

                <div class="table-section">
                    <h3>⏱️ Top Owners by Avg Cycle Time</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Owner</th>
                                <th>Avg Cycle Days</th>
                                <th>Median Cycle Time</th>
                                <th>Tickets</th>
                                <th>Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody id="table-owners">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Data refreshed at <span id="timestamp-footer"></span></p>
        </div>
    </div>
    
    <script>
        const analyticsData = ${JSON.stringify({
            summary,
            byType,
            bySprint,
            byEpic,
            byOwner,
            bugs
        })};
        
        const scatterDatasets = ${JSON.stringify(scatterDatasets)};
        const trendStats = ${JSON.stringify(trendStats)};
        const epicWeeklyData = ${JSON.stringify(epicWeeklyData)};
        
        let charts = {};
        
        function initializeDashboard() {
            populateFilters();
            renderCharts();
            renderTables();
            populateEpicWeeklySelect();
            document.getElementById('timestamp').textContent = new Date().toLocaleString();
            document.getElementById('timestamp-footer').textContent = new Date().toLocaleString();
            document.getElementById('exclude-members').addEventListener('input', function() {
                if (this.value.length === 0 || this.value.length % 15 === 0) applyFilters();
            });
            document.getElementById('exclude-members').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') applyFilters();
            });
        }
        
        function populateFilters() {
            const sprintSelect = document.getElementById('sprint-filter');
            analyticsData.bySprint.forEach(sprint => {
                const option = document.createElement('option');
                option.value = sprint.name;
                option.textContent = sprint.name;
                sprintSelect.appendChild(option);
            });
        }
        
        function applyFilters() {
            renderCharts();
            renderTables();
        }
        
        function resetFilters() {
            document.getElementById('sprint-filter').value = '';
            document.getElementById('exclude-members').value = '';
            applyFilters();
        }
        
        function getFilteredSprints() {
            const selected = document.getElementById('sprint-filter').value;
            return selected ? analyticsData.bySprint.filter(s => s.name === selected) : analyticsData.bySprint;
        }

        function getFilteredTickets() {
            const seen = new Set();
            const tickets = [];
            getFilteredSprints().forEach(s => s.tickets.forEach(t => {
                if (!seen.has(t.id)) { seen.add(t.id); tickets.push(t); }
            }));
            return tickets;
        }

        function renderCharts() {
            const filteredSprints = getFilteredSprints();
            const filteredTickets = getFilteredTickets();
            const excludedMembers = document.getElementById('exclude-members').value
                .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

            // Filter tickets by excluded members
            const ticketsAfterMemberFilter = filteredTickets.filter(t => {
                return !excludedMembers.some(ex => t.owner.toLowerCase().includes(ex));
            });

            // Update metric cards with recalculated values
            const completedTickets = ticketsAfterMemberFilter.filter(t => t.isCompleted && t.cycleTime !== null);
            const cycleTimes = completedTickets.map(t => t.cycleTime).sort((a, b) => a - b);
            const newMedian = cycleTimes.length > 0 ? cycleTimes[Math.floor(cycleTimes.length / 2)] : 0;
            const newAvg = cycleTimes.length > 0 ? (cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length).toFixed(1) : 0;

            // Calculate median cycle time for last 2 weeks from most recent data
            if (completedTickets.length > 0) {
                const mostRecentDate = new Date(Math.max(...completedTickets.map(t => new Date(t.completedAt).getTime())));
                const twoWeeksBeforeMostRecent = new Date(mostRecentDate);
                twoWeeksBeforeMostRecent.setDate(twoWeeksBeforeMostRecent.getDate() - 14);

                const last2WeeksTickets = completedTickets.filter(t => {
                    const completedDate = new Date(t.completedAt);
                    return completedDate >= twoWeeksBeforeMostRecent && completedDate <= mostRecentDate;
                });
                const last2WeeksCycleTimes = last2WeeksTickets.map(t => t.cycleTime).sort((a, b) => a - b);
                var medianLast2Weeks = last2WeeksCycleTimes.length > 0 ? last2WeeksCycleTimes[Math.floor(last2WeeksCycleTimes.length / 2)] : 0;
            } else {
                var medianLast2Weeks = 0;
            }

            document.querySelectorAll('.metric-card').forEach((card, idx) => {
                const heading = card.querySelector('h3');
                if (heading && heading.textContent === 'Median Cycle Time') {
                    card.querySelector('.metric-value').textContent = newMedian + ' days';
                }
                if (heading && heading.textContent === 'Avg Cycle Time') {
                    card.querySelector('.metric-value').textContent = newAvg + ' days';
                }
            });

            const metric2weeks = document.getElementById('metric-median-2weeks');
            if (metric2weeks) {
                metric2weeks.textContent = medianLast2Weeks + ' days';
            }

            const typeCtx = document.getElementById('chart-story-type').getContext('2d');
            if (charts.storyType) charts.storyType.destroy();
            const filteredByType = { feature: 0, bug: 0, chore: 0, other: 0 };
            filteredTickets.forEach(t => {
                if (filteredByType.hasOwnProperty(t.type)) filteredByType[t.type]++;
                else filteredByType.other++;
            });
            charts.storyType = new Chart(typeCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(filteredByType),
                    datasets: [{
                        data: Object.values(filteredByType),
                        backgroundColor: ['#667eea', '#f5576c', '#ffd89b', '#00d4ff'],
                        borderColor: 'white',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
            
            const epicCtx = document.getElementById('chart-epic-pie').getContext('2d');
            if (charts.epicPie) charts.epicPie.destroy();
            const epicCompMap = {};
            filteredTickets.forEach(t => {
                if (!epicCompMap[t.epic]) epicCompMap[t.epic] = 0;
                if (t.isCompleted) epicCompMap[t.epic]++;
            });
            const filteredEpicPie = Object.entries(epicCompMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
            const epicPieTotal = filteredEpicPie.reduce((s, [, v]) => s + v, 0);
            charts.epicPie = new Chart(epicCtx, {
                type: 'pie',
                data: {
                    labels: filteredEpicPie.map(([name, v]) => {
                        const pct = epicPieTotal > 0 ? ((v / epicPieTotal) * 100).toFixed(1) : '0.0';
                        return name + ' (' + pct + '%)';
                    }),
                    datasets: [{
                        data: filteredEpicPie.map(([, v]) => v),
                        backgroundColor: [
                            '#667eea', '#f5576c', '#ffd89b', '#00d4ff', '#ff6b6b',
                            '#4ecdc4', '#95e1d3', '#f9ca24', '#6c5ce7', '#a29bfe',
                            '#74b9ff', '#81ecec', '#55efc4', '#fd79a8', '#fdcb6e'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a,b) => a+b, 0);
                                    const pct = ((context.parsed / total) * 100).toFixed(1);
                                    return context.label + ': ' + context.parsed + ' tickets (' + pct + '%)';
                                }
                            }
                        }
                    }
                }
            });
            
            const epicCategoryCtx = document.getElementById('chart-epic-category').getContext('2d');
            if (charts.epicCategory) charts.epicCategory.destroy();
            (function() {
                const engineeringEpics = new Set([
                    'backend upgrades',
                    'create integration tests',
                    'merge to main: ship to prod (incremental releases)',
                    'delete your old code, david',
                    'application monitoring',
                    'data improvements',
                    'create ci/cd pipeline'
                ]);
                const categoryTotals = { BAU: 0, 'Tech Improvements': 0, Engineering: 0, Product: 0 };
                filteredTickets.forEach(t => {
                    const key = (t.epic || '').toLowerCase().trim();
                    if (key === 'bau') categoryTotals['BAU']++;
                    else if (key === 'tech improvements') categoryTotals['Tech Improvements']++;
                    else if (engineeringEpics.has(key)) categoryTotals['Engineering']++;
                    else categoryTotals['Product']++;
                });
                const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
                const labels = Object.keys(categoryTotals).map(k => {
                    const pct = total > 0 ? ((categoryTotals[k] / total) * 100).toFixed(1) : '0.0';
                    return k + ' (' + pct + '%)';
                });
                charts.epicCategory = new Chart(epicCategoryCtx, {
                    type: 'pie',
                    data: {
                        labels,
                        datasets: [{
                            data: Object.values(categoryTotals),
                            backgroundColor: ['#667eea', '#00b894', '#f5576c', '#ffd89b'],
                            borderColor: 'white',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const t = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const pct = t > 0 ? ((context.parsed / t) * 100).toFixed(1) : '0.0';
                                        return context.label.split(' (')[0] + ': ' + context.parsed + ' tickets (' + pct + '%)';
                                    }
                                }
                            }
                        }
                    }
                });
            })();

            const scatterCtx = document.getElementById('chart-scatter-cycle-time').getContext('2d');
            if (charts.scatter) charts.scatter.destroy();

            const filteredTicketIds = new Set(filteredTickets.map(t => t.id));
            const ownerDatasets = scatterDatasets
                .map(d => {
                    const isExcluded = excludedMembers.some(ex =>
                        d.fullName.toLowerCase().includes(ex) ||
                        d.label.toLowerCase().includes(ex)
                    );
                    const filteredData = d.data.filter(p => filteredTicketIds.has(p.id));

                    if (isExcluded) {
                        return {
                            ...d,
                            label: '⊘ ' + d.label + ' (excluded)',
                            data: [],
                            borderColor: 'rgba(200, 200, 200, 0.4)',
                            backgroundColor: 'rgba(200, 200, 200, 0.2)',
                            pointRadius: 0,
                            borderDash: [4, 4]
                        };
                    }
                    return { ...d, data: filteredData };
                });

            const filteredCycleTimes = ticketsAfterMemberFilter.filter(t => t.isCompleted && t.cycleTime !== null).map(t => t.cycleTime).sort((a, b) => a - b);
            const refMedian = filteredCycleTimes.length > 0 ? filteredCycleTimes[Math.floor(filteredCycleTimes.length / 2)] : 0;
            const refMean   = filteredCycleTimes.length > 0 ? filteredCycleTimes.reduce((a, b) => a + b, 0) / filteredCycleTimes.length : 0;

            const allPoints = ownerDatasets.flatMap(d => d.data);
            const xMin = allPoints.length > 0 ? Math.min(...allPoints.map(p => p.x)) : 0;
            const xMax = allPoints.length > 0 ? Math.max(...allPoints.map(p => p.x)) : 1;
            const pad = (xMax - xMin) * 0.02;

            const refLines = [
                { label: 'Median', value: refMedian, borderColor: 'rgba(0, 184, 148, 1)',    borderDash: [] },
                { label: 'Mean',   value: refMean,   borderColor: 'rgba(253, 203, 110, 1)',  borderDash: [6, 3] }
            ].map(r => ({
                label: r.label + ' (' + r.value.toFixed(1) + ' days)',
                type: 'line',
                data: [{ x: xMin - pad, y: r.value }, { x: xMax + pad, y: r.value }],
                borderColor: r.borderColor,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: r.borderDash,
                pointRadius: 0,
                fill: false,
                showLine: true
            }));

            charts.scatter = new Chart(scatterCtx, {
                type: 'scatter',
                data: { datasets: ownerDatasets.concat(refLines) },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', maxWidth: 200 },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.raw.name) return context.raw.name + ': ' + context.raw.y + ' days';
                                    return context.dataset.label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            ticks: {
                                callback: function(value) {
                                    return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' });
                                },
                                maxRotation: 45,
                                minRotation: 30,
                                maxTicksLimit: 12
                            }
                        },
                        y: { beginAtZero: true, title: { display: true, text: 'Cycle Time (days)' } }
                    }
                }
            });
            
            const velocityCtx = document.getElementById('chart-velocity').getContext('2d');
            if (charts.velocity) charts.velocity.destroy();
            charts.velocity = new Chart(velocityCtx, {
                type: 'bar',
                data: {
                    labels: filteredSprints.map(s => s.name.split('(')[0].trim()),
                    datasets: [
                        {
                            label: 'Created',
                            data: filteredSprints.map(s => s.created),
                            backgroundColor: '#667eea'
                        },
                        {
                            label: 'Completed',
                            data: filteredSprints.map(s => s.completed),
                            backgroundColor: '#00b894'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                }
            });
            
            const bugCtx = document.getElementById('chart-bugs').getContext('2d');
            if (charts.bugs) charts.bugs.destroy();
            charts.bugs = new Chart(bugCtx, {
                type: 'line',
                data: {
                    labels: filteredSprints.map(s => s.name.split('(')[0].trim()),
                    datasets: [
                        {
                            label: 'Bugs Created',
                            data: filteredSprints.map(s => s.tickets.filter(t => t.type === 'bug').length),
                            borderColor: '#d63031',
                            backgroundColor: 'rgba(214, 48, 49, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4
                        },
                        {
                            label: 'Bugs Completed',
                            data: filteredSprints.map(s => s.tickets.filter(t => t.type === 'bug' && t.isCompleted).length),
                            borderColor: '#00b894',
                            backgroundColor: 'rgba(0, 184, 148, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }
        
        function renderTables() {
            const filteredSprints = getFilteredSprints();
            const filteredTickets = getFilteredTickets();

            const epicTableMap = {};
            filteredTickets.forEach(t => {
                if (!epicTableMap[t.epic]) epicTableMap[t.epic] = { name: t.epic, created: 0, completed: 0 };
                epicTableMap[t.epic].created++;
                if (t.isCompleted) epicTableMap[t.epic].completed++;
            });
            document.getElementById('table-epics').innerHTML = Object.values(epicTableMap)
                .sort((a, b) => b.completed - a.completed)
                .map(e => {
                    const rate = e.created > 0 ? ((e.completed / e.created) * 100).toFixed(1) : '0';
                    return \`<tr>
                        <td>\${e.name}</td>
                        <td><span class="badge feature">\${e.created}</span></td>
                        <td><span class="badge completed">\${e.completed}</span></td>
                        <td><strong>\${rate}%</strong></td>
                    </tr>\`;
                }).join('');

            document.getElementById('table-sprints').innerHTML = filteredSprints.map(s => \`
                <tr>
                    <td>\${s.name}</td>
                    <td><span class="badge feature">\${s.created}</span></td>
                    <td><span class="badge completed">\${s.completed}</span></td>
                    <td><strong>\${s.completionRate}%</strong></td>
                </tr>
            \`).join('');

            const ownerTableMap = {};
            filteredTickets.forEach(t => {
                t.owner.split(';').map(o => o.trim()).forEach(owner => {
                    if (!owner || owner === 'Unassigned') return;
                    if (!ownerTableMap[owner]) ownerTableMap[owner] = { name: owner, tickets: 0, completed: 0, cycleTimes: [] };
                    ownerTableMap[owner].tickets++;
                    if (t.isCompleted) ownerTableMap[owner].completed++;
                    if (t.cycleTime !== null && t.isCompleted) ownerTableMap[owner].cycleTimes.push(t.cycleTime);
                });
            });
            const excludedMembersTable = document.getElementById('exclude-members').value
                .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            document.getElementById('table-owners').innerHTML = Object.values(ownerTableMap)
                .map(o => {
                    const sorted = [...o.cycleTimes].sort((a, b) => a - b);
                    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
                    return {
                        ...o,
                        avgCycleTime: o.cycleTimes.length > 0 ? parseFloat((o.cycleTimes.reduce((a, b) => a + b, 0) / o.cycleTimes.length).toFixed(1)) : 0,
                        medianCycleTime: median,
                        completionRate: o.tickets > 0 ? ((o.completed / o.tickets) * 100).toFixed(1) : '0'
                    };
                })
                .sort((a, b) => a.avgCycleTime - b.avgCycleTime)
                .filter(o => !excludedMembersTable.some(ex => o.name.toLowerCase().includes(ex)))
                .slice(0, 15).map(o => \`
                <tr>
                    <td>\${o.name}</td>
                    <td><strong>\${o.avgCycleTime}</strong></td>
                    <td>\${o.medianCycleTime}</td>
                    <td>\${o.tickets}</td>
                    <td>\${o.completionRate}%</td>
                </tr>
            \`).join('');
        }
        
        function populateEpicWeeklySelect() {
            const select = document.getElementById('epic-weekly-select');
            Object.keys(epicWeeklyData).sort().forEach(epic => {
                const opt = document.createElement('option');
                opt.value = epic;
                opt.textContent = epic;
                select.appendChild(opt);
            });
        }

        function toggleEpicWeekly(heading) {
            const body = document.getElementById('section-epic-weekly');
            const collapsed = body.classList.toggle('collapsed');
            heading.classList.toggle('collapsed', collapsed);
            if (!collapsed) renderEpicWeeklyChart();
        }

        function renderEpicWeeklyChart() {
            const epic = document.getElementById('epic-weekly-select').value;
            const data = epicWeeklyData[epic];
            if (!data) return;
            const ctx = document.getElementById('chart-epic-weekly').getContext('2d');
            if (charts.epicWeekly) charts.epicWeekly.destroy();
            charts.epicWeekly = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.weeks,
                    datasets: [
                        {
                            label: 'Created',
                            data: data.created,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 4
                        },
                        {
                            label: 'Completed',
                            data: data.completed,
                            borderColor: '#00b894',
                            backgroundColor: 'rgba(0, 184, 148, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        x: { title: { display: true, text: 'Week starting' } },
                        y: { beginAtZero: true, title: { display: true, text: 'Tickets' }, ticks: { stepSize: 1 } }
                    }
                }
            });
        }

        function toggleTable(heading, bodyId) {
            const body = document.getElementById(bodyId);
            const collapsed = body.classList.toggle('collapsed');
            heading.classList.toggle('collapsed', collapsed);
        }

        window.addEventListener('load', initializeDashboard);
    </script>
</body>
</html>`;

    return html;
}

/**
 * Normalize owner name for matching (email prefix or name parts)
 */
function normalizeOwnerName(ownerStr) {
    if (!ownerStr) return '';
    ownerStr = ownerStr.trim();
    if (ownerStr.includes('@')) {
        return ownerStr.split('@')[0].toLowerCase().replace(/\./g, ' ');
    }
    return ownerStr.toLowerCase().trim();
}

/**
 * Generate scatter plot data — one point per completed ticket per owner
 */
function generateScatterData(byOwner, allTickets) {
    const datasets = [];
    const colors = [
        'rgba(102, 126, 234, 0.7)', 'rgba(245, 87, 108, 0.7)', 'rgba(255, 216, 155, 0.7)',
        'rgba(0, 212, 255, 0.7)', 'rgba(255, 107, 107, 0.7)', 'rgba(78, 205, 196, 0.7)',
        'rgba(149, 225, 211, 0.7)', 'rgba(249, 202, 36, 0.7)', 'rgba(108, 92, 231, 0.7)',
        'rgba(162, 155, 254, 0.7)', 'rgba(116, 185, 255, 0.7)', 'rgba(129, 236, 236, 0.7)'
    ];

    byOwner.slice(0, 10).forEach((owner, idx) => {
        const ownerNormalized = normalizeOwnerName(owner.name);
        const data = allTickets
            .filter(t => {
                if (!t.isCompleted || !t.completedAt || t.cycleTime === null) return false;
                const ticketOwners = t.owner.split(/[;,]/).map(o => normalizeOwnerName(o.trim()));
                return ticketOwners.includes(ownerNormalized);
            })
            .map(t => ({ x: new Date(t.completedAt).getTime(), y: t.cycleTime, name: t.name, id: t.id }));

        if (data.length > 0) {
            datasets.push({
                label: owner.displayName || owner.name.split('@')[0],
                fullName: owner.name,
                data,
                borderColor: colors[idx % colors.length],
                backgroundColor: colors[idx % colors.length],
                showLine: false,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            });
        }
    });

    return datasets;
}

/**
 * Compute overall cycle time statistics for reference lines
 */
function computeOverallCycleStats(allTickets) {
    const cycleTimes = allTickets
        .filter(t => t.isCompleted && t.cycleTime !== null)
        .map(t => t.cycleTime)
        .sort((a, b) => a - b);

    if (cycleTimes.length === 0) return { mean: 0, median: 0, q1: 0, q3: 0 };

    return {
        mean: parseFloat((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length).toFixed(1)),
        median: cycleTimes[Math.floor(cycleTimes.length / 2)],
        q1: cycleTimes[Math.floor(cycleTimes.length * 0.25)],
        q3: cycleTimes[Math.floor(cycleTimes.length * 0.75)]
    };
}

/**
 * Compute per-epic weekly created/completed ticket counts
 */
function computeEpicWeeklyData(allTickets) {
    function weekStart(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        const day = d.getDay();
        const monday = new Date(d);
        monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0];
    }

    const epicMap = {};
    allTickets.forEach(ticket => {
        const epic = ticket.epic || '(Unassigned)';
        if (!epicMap[epic]) epicMap[epic] = {};

        const cw = weekStart(ticket.createdAt);
        if (cw) {
            if (!epicMap[epic][cw]) epicMap[epic][cw] = { created: 0, completed: 0 };
            epicMap[epic][cw].created++;
        }

        if (ticket.isCompleted && ticket.completedAt) {
            const dw = weekStart(ticket.completedAt);
            if (dw) {
                if (!epicMap[epic][dw]) epicMap[epic][dw] = { created: 0, completed: 0 };
                epicMap[epic][dw].completed++;
            }
        }
    });

    const result = {};
    for (const [epic, weekMap] of Object.entries(epicMap)) {
        const weeks = Object.keys(weekMap).sort();
        result[epic] = {
            weeks,
            created: weeks.map(w => weekMap[w].created),
            completed: weeks.map(w => weekMap[w].completed)
        };
    }
    return result;
}

module.exports = { generateDashboardHTML };
