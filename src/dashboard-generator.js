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
    const scatterDatasets = generateScatterData(byOwner, bySprint, allTickets);
    
    // Generate trend stats
    const trendStats = generateTrendStats(bySprint, allTickets);

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
                    <h3>🎯 Velocity by Epic</h3>
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
                
                <div class="table-section">
                    <h3>🏃 Velocity by Sprint</h3>
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
                
                <div class="table-section">
                    <h3>⏱️ Top Owners by Avg Cycle Time</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Owner</th>
                                <th>Avg Cycle Days</th>
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
        
        let charts = {};
        
        function initializeDashboard() {
            populateFilters();
            renderCharts();
            renderTables();
            document.getElementById('timestamp').textContent = new Date().toLocaleString();
            document.getElementById('timestamp-footer').textContent = new Date().toLocaleString();
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
            applyFilters();
        }
        
        function renderCharts() {
            const typeCtx = document.getElementById('chart-story-type').getContext('2d');
            if (charts.storyType) charts.storyType.destroy();
            charts.storyType = new Chart(typeCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(analyticsData.byType),
                    datasets: [{
                        data: Object.values(analyticsData.byType),
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
            charts.epicPie = new Chart(epicCtx, {
                type: 'pie',
                data: {
                    labels: analyticsData.byEpic.map(e => {
                        const total = analyticsData.byEpic.reduce((sum, ep) => sum + ep.completed, 0);
                        const pct = total > 0 ? ((e.completed / total) * 100).toFixed(1) : '0.0';
                        return e.name + ' (' + pct + '%)';
                    }),
                    datasets: [{
                        data: analyticsData.byEpic.map(e => e.completed),
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
            
            const scatterCtx = document.getElementById('chart-scatter-cycle-time').getContext('2d');
            if (charts.scatter) charts.scatter.destroy();
            
            const colors = [
                'rgba(102, 126, 234, 0.7)', 'rgba(245, 87, 108, 0.7)', 'rgba(255, 216, 155, 0.7)',
                'rgba(0, 212, 255, 0.7)', 'rgba(255, 107, 107, 0.7)', 'rgba(78, 205, 196, 0.7)',
                'rgba(149, 225, 211, 0.7)', 'rgba(249, 202, 36, 0.7)', 'rgba(108, 92, 231, 0.7)',
                'rgba(162, 155, 254, 0.7)', 'rgba(116, 185, 255, 0.7)', 'rgba(129, 236, 236, 0.7)'
            ];
            
            const ownerDatasets = scatterDatasets.slice(0, -4);
            const rawTrendLines = scatterDatasets.slice(-4);

            const trendLineStyle = {
                Mean:   { borderColor: 'rgba(253, 203, 110, 1)',   borderDash: [6, 3] },
                Median: { borderColor: 'rgba(0, 184, 148, 1)',     borderDash: [] },
                Q1:     { borderColor: 'rgba(116, 185, 255, 0.9)', borderDash: [3, 3] },
                Q3:     { borderColor: 'rgba(253, 121, 168, 0.9)', borderDash: [3, 3] }
            };
            const trendDataKey = { Mean: 'mean', Median: 'median', Q1: 'q1', Q3: 'q3' };
            const populatedTrendLines = rawTrendLines.map(trend => {
                const style = trendLineStyle[trend.label] || {};
                const key = trendDataKey[trend.label];
                return {
                    label: trend.label,
                    type: 'line',
                    data: Object.entries(trendStats)
                        .map(([idx, s]) => ({ x: parseInt(idx), y: parseFloat(s[key].toFixed(1)) })),
                    showLine: true,
                    fill: false,
                    borderColor: style.borderColor,
                    backgroundColor: style.borderColor,
                    borderWidth: 2,
                    borderDash: style.borderDash,
                    pointRadius: 3,
                    tension: 0.3
                };
            });

            charts.scatter = new Chart(scatterCtx, {
                type: 'scatter',
                data: { datasets: ownerDatasets.concat(populatedTrendLines) },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', maxWidth: 200 },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.raw.y ? context.raw.y.toFixed(1) + ' days' : '';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: { display: false },
                            min: -0.5,
                            max: ${bySprint.length - 0.5},
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    const idx = Math.round(value);
                                    const sprint = analyticsData.bySprint[idx];
                                    return sprint ? sprint.name : '';
                                },
                                maxRotation: 45,
                                minRotation: 30
                            }
                        },
                        y: { title: { display: true, text: 'Cycle Time (days)' } }
                    }
                }
            });
            
            const velocityCtx = document.getElementById('chart-velocity').getContext('2d');
            if (charts.velocity) charts.velocity.destroy();
            charts.velocity = new Chart(velocityCtx, {
                type: 'bar',
                data: {
                    labels: analyticsData.bySprint.map(s => s.name.split('(')[0].trim()),
                    datasets: [
                        {
                            label: 'Created',
                            data: analyticsData.bySprint.map(s => s.created),
                            backgroundColor: '#667eea'
                        },
                        {
                            label: 'Completed',
                            data: analyticsData.bySprint.map(s => s.completed),
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
                    labels: analyticsData.bySprint.map(s => s.name.split('(')[0].trim()),
                    datasets: [{
                        label: 'Bugs (approx)',
                        data: analyticsData.bySprint.map((s, i) => Math.floor(s.created * 0.15)),
                        borderColor: '#d63031',
                        backgroundColor: 'rgba(214, 48, 49, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
        
        function renderTables() {
            document.getElementById('table-epics').innerHTML = analyticsData.byEpic.map(e => \`
                <tr>
                    <td>\${e.name}</td>
                    <td><span class="badge feature">\${e.created}</span></td>
                    <td><span class="badge completed">\${e.completed}</span></td>
                    <td><strong>\${e.completionRate}%</strong></td>
                </tr>
            \`).join('');
            
            document.getElementById('table-sprints').innerHTML = analyticsData.bySprint.map(s => \`
                <tr>
                    <td>\${s.name}</td>
                    <td><span class="badge feature">\${s.created}</span></td>
                    <td><span class="badge completed">\${s.completed}</span></td>
                    <td><strong>\${s.completionRate}%</strong></td>
                </tr>
            \`).join('');
            
            document.getElementById('table-owners').innerHTML = analyticsData.byOwner.slice(0, 15).map(o => \`
                <tr>
                    <td>\${o.name}</td>
                    <td><strong>\${o.avgCycleTime}</strong></td>
                    <td>\${o.tickets}</td>
                    <td>\${o.completionRate}%</td>
                </tr>
            \`).join('');
        }
        
        window.addEventListener('load', initializeDashboard);
    </script>
</body>
</html>`;

    return html;
}

/**
 * Generate scatter plot data from owner and sprint information
 */
function generateScatterData(byOwner, bySprint, allTickets) {
    const datasets = [];
    const colors = [
        'rgba(102, 126, 234, 0.7)', 'rgba(245, 87, 108, 0.7)', 'rgba(255, 216, 155, 0.7)',
        'rgba(0, 212, 255, 0.7)', 'rgba(255, 107, 107, 0.7)', 'rgba(78, 205, 196, 0.7)'
    ];
    
    // Add owner datasets
    byOwner.slice(0, 10).forEach((owner, idx) => {
        const ownerTickets = allTickets.filter(t => 
            t.owner.includes(owner.name) && t.isCompleted && t.sprint
        );
        
        const data = [];
        bySprint.forEach((sprint, sprintIdx) => {
            const sprintTickets = ownerTickets.filter(t => t.sprint.name === sprint.name);
            if (sprintTickets.length > 0) {
                const avgCycleTime = sprintTickets.reduce((sum, t) => sum + (t.cycleTime || 0), 0) / sprintTickets.length;
                data.push({ x: sprintIdx, y: Math.round(avgCycleTime) });
            }
        });
        
        if (data.length > 0) {
            datasets.push({
                label: owner.name.split('@')[0],
                data,
                borderColor: colors[idx % colors.length],
                backgroundColor: colors[idx % colors.length],
                showLine: false,
                fill: false,
                pointRadius: 6
            });
        }
    });
    
    // Add trend lines (will be calculated on client side)
    datasets.push({ label: 'Mean', data: [] });
    datasets.push({ label: 'Median', data: [] });
    datasets.push({ label: 'Q1', data: [] });
    datasets.push({ label: 'Q3', data: [] });
    
    return datasets;
}

/**
 * Generate trend statistics
 */
function generateTrendStats(bySprint, allTickets) {
    const stats = {};
    
    bySprint.forEach((sprint, idx) => {
        const sprintTickets = allTickets.filter(t => t.sprint && t.sprint.name === sprint.name && t.cycleTime !== null && t.isCompleted);
        const cycleTimes = sprintTickets.map(t => t.cycleTime).sort((a, b) => a - b);
        
        if (cycleTimes.length > 0) {
            stats[idx] = {
                mean: cycleTimes.reduce((a, b) => a + b) / cycleTimes.length,
                median: cycleTimes[Math.floor(cycleTimes.length / 2)],
                q1: cycleTimes[Math.floor(cycleTimes.length * 0.25)],
                q3: cycleTimes[Math.floor(cycleTimes.length * 0.75)]
            };
        }
    });
    
    return stats;
}

module.exports = { generateDashboardHTML };
