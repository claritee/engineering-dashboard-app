const csv = require('csv-parse/sync');

/**
 * Parse CSV content and extract records
 */
function parseCSV(content) {
    return csv.parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
    });
}

/**
 * Extract sprint name from file or iteration field
 */
function extractSprintInfo(filename, record) {
    // Try to extract from filename like "iteration-10414.csv"
    const match = filename.match(/iteration-(\d+)/);
    
    // Try to get from record iteration field
    if (record.iteration && record.iteration.trim()) {
        return {
            id: record.iteration_id || match?.[1] || 'unknown',
            name: record.iteration
        };
    }
    
    if (match) {
        return {
            id: match[1],
            name: `Sprint ${match[1]}`
        };
    }
    
    return null;
}

/**
 * Calculate cycle time in days
 */
function calculateCycleTime(startedDate, completedDate) {
    if (!startedDate || !completedDate) return null;
    
    try {
        const start = new Date(startedDate);
        const completed = new Date(completedDate);
        
        if (isNaN(start.getTime()) || isNaN(completed.getTime())) return null;
        
        const diffMs = completed - start;
        return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    } catch (e) {
        return null;
    }
}

/**
 * Calculate statistics from an array of values
 */
function calculateStats(values) {
    if (values.length === 0) return { avg: 0, median: 0, min: 0, max: 0 };
    
    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return {
        avg: parseFloat(avg.toFixed(1)),
        median,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        q1: sorted[Math.floor(sorted.length * 0.25)],
        q3: sorted[Math.floor(sorted.length * 0.75)]
    };
}

/**
 * Main analysis function
 */
async function analyzeTickets(csvFiles) {
    const tickets = [];
    const sprintMap = new Map();
    const epicMap = new Map();
    const ownerMap = new Map();
    const typeCount = { feature: 0, bug: 0, chore: 0, other: 0 };
    
    // Parse all CSV files
    for (const csvFile of csvFiles) {
        try {
            const records = parseCSV(csvFile.content);
            
            for (const record of records) {
                const sprintInfo = extractSprintInfo(csvFile.name, record);
                const cycleTime = calculateCycleTime(record.started_at, record.completed_at);
                const isCompleted = !!(record.completed_at && record.completed_at.trim() !== '');
                
                const ticket = {
                    id: record.id,
                    name: record.name,
                    type: (record.type || 'other').toLowerCase(),
                    epic: record.epic || '(Unassigned)',
                    owner: record.owners || 'Unassigned',
                    sprint: sprintInfo,
                    cycleTime,
                    isCompleted,
                    createdAt: record.created_at,
                    startedAt: record.started_at,
                    completedAt: record.completed_at
                };
                
                tickets.push(ticket);
                
                // Count types
                if (typeCount.hasOwnProperty(ticket.type)) {
                    typeCount[ticket.type]++;
                } else {
                    typeCount.other++;
                }
                
                // Track sprints
                if (sprintInfo) {
                    if (!sprintMap.has(sprintInfo.id)) {
                        sprintMap.set(sprintInfo.id, {
                            id: sprintInfo.id,
                            name: sprintInfo.name,
                            created: 0,
                            completed: 0,
                            tickets: []
                        });
                    }
                    const sprint = sprintMap.get(sprintInfo.id);
                    sprint.created++;
                    if (isCompleted) sprint.completed++;
                    sprint.tickets.push(ticket);
                }
                
                // Track epics
                if (!epicMap.has(ticket.epic)) {
                    epicMap.set(ticket.epic, {
                        name: ticket.epic,
                        created: 0,
                        completed: 0,
                        tickets: []
                    });
                }
                const epic = epicMap.get(ticket.epic);
                epic.created++;
                if (isCompleted) epic.completed++;
                epic.tickets.push(ticket);
                
                // Track owners
                const owners = ticket.owner.split(';').map(o => o.trim());
                for (const owner of owners) {
                    if (owner && owner !== 'Unassigned') {
                        if (!ownerMap.has(owner)) {
                            ownerMap.set(owner, {
                                name: owner,
                                tickets: 0,
                                completed: 0,
                                cycleTimes: []
                            });
                        }
                        const ownerStats = ownerMap.get(owner);
                        ownerStats.tickets++;
                        if (isCompleted) ownerStats.completed++;
                        if (cycleTime !== null && isCompleted) {
                            ownerStats.cycleTimes.push(cycleTime);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error parsing ${csvFile.name}:`, error.message);
        }
    }
    
    // Calculate sprint statistics
    const bySprint = Array.from(sprintMap.values())
        .sort((a, b) => a.id - b.id)
        .map(sprint => ({
            ...sprint,
            completionRate: sprint.created > 0 ? ((sprint.completed / sprint.created) * 100).toFixed(1) : '0'
        }));
    
    // Calculate epic statistics
    const byEpic = Array.from(epicMap.values())
        .sort((a, b) => b.completed - a.completed)
        .map(epic => ({
            ...epic,
            completionRate: epic.created > 0 ? ((epic.completed / epic.created) * 100).toFixed(1) : '0'
        }));
    
    // Calculate owner statistics
    const byOwner = Array.from(ownerMap.values())
        .map(owner => ({
            ...owner,
            avgCycleTime: owner.cycleTimes.length > 0 
                ? parseFloat((owner.cycleTimes.reduce((a, b) => a + b, 0) / owner.cycleTimes.length).toFixed(1))
                : 0,
            completionRate: owner.tickets > 0 ? ((owner.completed / owner.tickets) * 100).toFixed(1) : '0'
        }))
        .sort((a, b) => a.avgCycleTime - b.avgCycleTime);
    
    // Calculate overall statistics
    const completedTickets = tickets.filter(t => t.isCompleted);
    const cycleTimes = tickets
        .filter(t => t.cycleTime !== null && t.isCompleted)
        .map(t => t.cycleTime);
    const cycleStats = calculateStats(cycleTimes);
    
    // Count bugs
    const bugs = tickets.filter(t => t.type === 'bug');
    const bugsCompleted = bugs.filter(t => t.isCompleted);
    
    const analysis = {
        summary: {
            totalTickets: tickets.length,
            totalCompleted: completedTickets.length,
            completionRate: ((completedTickets.length / tickets.length) * 100).toFixed(1),
            avgCycleTime: cycleStats.avg,
            medianCycleTime: cycleStats.median,
            cycleTimeQ1: cycleStats.q1,
            cycleTimeQ3: cycleStats.q3
        },
        byType: typeCount,
        bySprint,
        byEpic,
        byOwner,
        bugs: {
            total: bugs.length,
            completed: bugsCompleted.length,
            closureRate: bugs.length > 0 ? ((bugsCompleted.length / bugs.length) * 100).toFixed(1) : '100'
        },
        cycleTimes: cycleStats,
        allTickets: tickets
    };
    
    return analysis;
}

module.exports = { analyzeTickets };
