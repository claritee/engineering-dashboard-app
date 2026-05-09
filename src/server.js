const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { analyzeTickets } = require('./analyzer');
const { generateDashboardHTML } = require('./dashboard-generator');
const { generateReports } = require('./report-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../data/uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

/**
 * GET / - Serve the upload page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * POST /api/upload - Upload CSV files and generate dashboard
 */
app.post('/api/upload', upload.array('csvFiles', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No CSV files uploaded' });
        }

        // Read all uploaded CSV files
        const csvFiles = [];
        for (const file of req.files) {
            const content = await fs.readFile(file.path, 'utf-8');
            csvFiles.push({
                name: file.originalname,
                path: file.path,
                content
            });
        }

        // Analyze the CSV data
        const analysis = await analyzeTickets(csvFiles);

        // Generate dashboard HTML
        const dashboardHTML = generateDashboardHTML(analysis);

        // Generate reports
        const reports = await generateReports(analysis);

        // Save dashboard HTML
        const dashboardDir = path.join(__dirname, '../public/generated');
        await fs.mkdir(dashboardDir, { recursive: true });
        const dashboardPath = path.join(dashboardDir, 'dashboard.html');
        await fs.writeFile(dashboardPath, dashboardHTML);

        // Save reports
        const reportsDir = path.join(dashboardDir, 'reports');
        await fs.mkdir(reportsDir, { recursive: true });

        for (const [reportName, reportContent] of Object.entries(reports)) {
            const reportPath = path.join(reportsDir, reportName);
            if (reportName.endsWith('.csv')) {
                await fs.writeFile(reportPath, reportContent);
            } else {
                await fs.writeFile(reportPath, reportContent);
            }
        }

        // Return success with links to generated files
        res.json({
            success: true,
            dashboardUrl: '/generated/dashboard.html',
            reports: {
                analysis: '/generated/reports/analysis.md',
                sprintVelocity: '/generated/reports/sprint_velocity.csv',
                epicVelocity: '/generated/reports/epic_velocity.csv',
                ownerPerformance: '/generated/reports/owner_performance.csv',
                typeAnalysis: '/generated/reports/ticket_type_analysis.csv'
            },
            analysis
        });
    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/download/:type - Download reports
 */
app.get('/api/download/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const reportsDir = path.join(__dirname, '../public/generated/reports');
        
        let filename;
        if (type === 'analysis') {
            filename = 'analysis.md';
        } else if (type === 'sprint-velocity') {
            filename = 'sprint_velocity.csv';
        } else if (type === 'epic-velocity') {
            filename = 'epic_velocity.csv';
        } else if (type === 'owner-performance') {
            filename = 'owner_performance.csv';
        } else if (type === 'type-analysis') {
            filename = 'ticket_type_analysis.csv';
        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        const filepath = path.join(reportsDir, filename);
        const stat = await fs.stat(filepath);

        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const fileStream = require('fs').createReadStream(filepath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ error: 'Report not found or error occurred' });
    }
});

/**
 * GET /generated/* - Serve generated files (dashboard and reports)
 */
app.use('/generated', express.static(path.join(__dirname, '../public/generated')));

/**
 * Error handler
 */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Engineering Dashboard App running at http://localhost:${PORT}`);
    console.log(`📊 Visit the app and upload CSV files to generate your dashboard\n`);
});
